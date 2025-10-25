import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
// @ts-ignore - 保留用于未来功能
import { invoke } from "@tauri-apps/api/core";
import type { Channel } from "../App";

interface VideoPlayerProps {
  channel: Channel | null;
}

function VideoPlayer({ channel }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bufferInfo, setBufferInfo] = useState<string>("");
  const blobUrlRef = useRef<string | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!videoRef.current || !channel) return;

    setError(null);
    setLoading(true);

    const video = videoRef.current;

    // 清理之前的实例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // 清理之前的 Blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    console.log("原始 URL:", channel.url);

    // 重置重试计数器
    retryCountRef.current = 0;

    // 检查是否是 IPv6 URL
    const isIpv6 = channel.url.includes('[') && channel.url.includes(']');

    // 🚀 预连接优化 - 提前建立 TCP 连接到代理服务器
    const preconnectToProxy = () => {
      const existingLink = document.querySelector('link[rel="preconnect"][href="http://127.0.0.1:18080"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = 'http://127.0.0.1:18080';
        document.head.appendChild(link);
        console.log("🔗 预连接到代理服务器");
      }
    };

    // 如果是 IPv6 URL，预连接到代理
    if (isIpv6) {
      preconnectToProxy();
    }

    // 异步加载视频
    const loadVideo = async () => {
      let processedUrl = channel.url;

      // ⭐ 所有 m3u8 都走代理（修复混合内容问题 + IPv6支持）
      if (channel.url.includes(".m3u8")) {
        console.log("🌐 检测到 m3u8，通过代理访问");

        // 直接将原始 URL 编码后传给代理服务器
        const encodedUrl = encodeURIComponent(channel.url);
        processedUrl = `http://127.0.0.1:18080/proxy?url=${encodedUrl}`;

        console.log("🔄 代理 URL:", processedUrl);
        if (isIpv6) {
          console.log("  (IPv6 URL)");
        }
      }

      // 检查是否是 HLS 流
      if (processedUrl.includes(".m3u8") || processedUrl.startsWith("blob:")) {
        if (Hls.isSupported()) {
          // 🔥 完全复制 x-iptv-player 的 HLS.js 配置
          console.log('========== HLS播放器初始化开始 ==========');
          console.log(`播放地址: ${processedUrl}`);

          const hls = new Hls({
            // 基础配置
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,  // ⭐ 改为 false，更稳定

            // ⭐ 超时配置 - 大幅增加
            fragLoadingTimeOut: 60000,        // 60 秒（原 20 秒）
            manifestLoadingTimeOut: 30000,    // 30 秒（原 20 秒）
            levelLoadingTimeOut: 30000,       // 30 秒（原 20 秒）

            // ⭐ 重试配置 - 增加次数和延迟
            manifestLoadingMaxRetry: 6,       // 6 次（原 4 次）
            levelLoadingMaxRetry: 6,          // 6 次（原 4 次）
            fragLoadingMaxRetry: 8,           // 8 次（原 4 次）
            manifestLoadingRetryDelay: 1000,
            levelLoadingRetryDelay: 1000,
            fragLoadingRetryDelay: 1000,

            // ⭐ Buffer 配置 - 大幅增加
            maxBufferLength: 30,              // 30 秒（原 10 秒）
            maxMaxBufferLength: 60,           // 60 秒（原 30 秒）
            backBufferLength: 30,             // 30 秒保持不变
            maxBufferSize: 120 * 1000 * 1000, // 120 MB
            maxBufferHole: 0.5,               // ⭐ 允许 0.5 秒的 buffer hole

            // ⭐ ABR 配置 - 更保守
            startLevel: -1,
            abrEwmaDefaultEstimate: 500000,
            abrEwmaFastLive: 3.0,
            abrEwmaSlowLive: 9.0,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.7,

            // 其他配置
            progressive: true,
            testBandwidth: true,
            enableSoftwareAES: true,

            // ⭐ 长超时用于重试
            fragLoadingMaxRetryTimeout: 120000,
            manifestLoadingMaxRetryTimeout: 120000,
            levelLoadingMaxRetryTimeout: 120000,
          });

          hls.loadSource(processedUrl);
          console.log('开始加载视频源...');

          hls.attachMedia(video);
          console.log('HLS媒体已附加到视频元素');

        // 🔥 完全复制 x-iptv-player 的事件监听器
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('媒体附加成功，音量设置为:', video.volume);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          const manifestInfo = {
            levels: data.levels.length,
            firstLevel: data.firstLevel,
            audioTracks: data.audioTracks?.length || 0,
            subtitleTracks: data.subtitleTracks?.length || 0
          };
          console.log('HLS清单解析完成:', JSON.stringify(manifestInfo, null, 2));

          if (data.levels.length > 1) {
            const levelsInfo = data.levels.map((level: any) => ({
              height: level.height,
              bitrate: Math.round(level.bitrate / 1024) + 'kbps'
            }));
            console.log('可用清晰度:', JSON.stringify(levelsInfo, null, 2));
          }

          // ⭐ 诊断：检查是否是直播流
          console.log('🔍 视频类型诊断:');
          console.log('  - Video duration:', video.duration);
          console.log('  - Is live stream:', video.duration === Infinity);
          console.log('  - HLS levels:', data.levels.length);

          // 检查第一个 level 的详细信息
          if (data.levels.length > 0) {
            const firstLevel = data.levels[0];
            console.log('  - First level details:', {
              url: firstLevel.url?.[0] || firstLevel.url,
              fragments: firstLevel.details?.fragments?.length || 0,
              live: firstLevel.details?.live,
              type: firstLevel.details?.type,
              targetduration: firstLevel.details?.targetduration
            });
          }

          setLoading(false);
          setBufferInfo("");

          video.play()
            .then(() => {
              console.log('播放开始成功');
            })
            .catch((error) => {
              console.log('自动播放失败，尝试静音播放:', error.message);
              video.muted = true;
              video.play()
                .then(() => {
                  console.log('静音播放成功');
                  // 播放成功后取消静音
                  setTimeout(() => {
                    video.muted = false;
                    console.log('🔊 已取消静音');
                  }, 100);
                })
                .catch((err) => {
                  console.error('播放失败:', err);
                  setError('自动播放失败，请点击播放按钮');
                });
            });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          const switchInfo = {
            level: data.level,
            height: hls.levels[data.level]?.height,
            bitrate: Math.round(hls.levels[data.level]?.bitrate / 1024) + 'kbps'
          };
          console.log('清晰度切换:', JSON.stringify(switchInfo, null, 2));
        });

        // 🔥 完全复制 x-iptv-player 的错误处理 + 智能过滤
        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.log('HLS错误事件:', {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
          });

          // ⭐ 智能错误过滤 - 忽略非致命且可自动恢复的错误
          const ignorableErrors = [
            'fragLoadError',        // HLS.js 会自动重试
            'fragLoadTimeOut',      // HLS.js 会自动重试
            'levelLoadTimeOut',     // HLS.js 会自动重试
            'manifestLoadTimeOut',  // HLS.js 会自动重试（非致命时）
            'keyLoadError',         // 解密错误，HLS.js 会尝试恢复
            'fragParsingError',     // 片段解析错误，可能是暂时的
          ];

          const shouldIgnore = !data.fatal && ignorableErrors.includes(data.details);

          if (shouldIgnore) {
            console.log('⏭️ 忽略非致命错误，HLS.js 将自动处理:', data.details);

            // 仅显示友好提示
            if (data.details === 'fragLoadTimeOut' || data.details === 'fragLoadError') {
              setBufferInfo('⏳ 缓冲中...');
              setTimeout(() => setBufferInfo(''), 3000);
            }
            return;
          }

          // 处理致命错误或需要干预的错误
          let errorDescription = '未知错误';
          switch (data.details) {
            case 'manifestLoadError':
              errorDescription = '播放列表加载失败';
              break;
            case 'manifestLoadTimeOut':
              errorDescription = '播放列表加载超时';
              break;
            case 'manifestParsingError':
              errorDescription = '播放列表解析失败';
              break;
            case 'levelLoadError':
              errorDescription = '视频清晰度信息加载失败';
              break;
            case 'levelLoadTimeOut':
              errorDescription = '视频清晰度信息加载超时';
              break;
            case 'fragLoadError':
              errorDescription = '视频片段加载失败';
              break;
            case 'fragLoadTimeOut':
              errorDescription = '视频片段加载超时';
              break;
            case 'bufferAddCodecError':
              errorDescription = '视频编码不支持';
              break;
            case 'bufferAppendError':
              errorDescription = '视频缓冲区写入失败';
              break;
            case 'bufferFullError':
              errorDescription = '视频缓冲区已满';
              break;
            case 'bufferStalledError':
              errorDescription = '视频缓冲区暂停';
              break;
            case 'audioTrackLoadError':
              errorDescription = '音频轨道加载失败';
              break;
          }

          if (data.fatal) {
            console.error('❌ HLS致命错误:', errorDescription, data);

            // ⭐ 尝试自动恢复
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);

              console.log(`🔄 尝试恢复 (${retryCountRef.current}/${maxRetries})，延迟: ${delay}ms`);
              setBufferInfo(`🔄 尝试恢复 (${retryCountRef.current}/${maxRetries})...`);

              setTimeout(() => {
                if (hlsRef.current) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      console.log('🌐 网络错误，重新加载...');
                      hlsRef.current.startLoad();
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.log('🎬 媒体错误，尝试恢复...');
                      hlsRef.current.recoverMediaError();
                      break;
                    default:
                      console.log('🔄 其他错误，重新加载...');
                      hlsRef.current.startLoad();
                  }
                  setBufferInfo('');
                }
              }, delay);
            } else {
              setError(`播放失败: ${errorDescription}`);
              setLoading(false);
            }
          } else {
            console.warn('⚠️ HLS警告:', errorDescription);
          }
        });

        // ⭐ 诊断：监听 HLS fragment 加载
        hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
          console.log('📦 Fragment 加载完成:', {
            sn: data.frag.sn,
            duration: data.frag.duration.toFixed(2) + 's',
            type: data.frag.type,
            level: data.frag.level
          });
        });

        // ⭐ 诊断：监听 level 加载
        hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
          console.log('📋 Level 清单加载:', {
            level: data.level,
            live: data.details.live,
            fragments: data.details.fragments.length,
            targetduration: data.details.targetduration,
            totalduration: data.details.totalduration?.toFixed(2)
          });

          // ⭐ 关键诊断：检查是否是直播
          if (!data.details.live) {
            console.warn('⚠️⚠️⚠️ 这不是直播流！这是 VOD（点播视频）');
            console.warn('  - live:', data.details.live);
            console.warn('  - type:', data.details.type);
            console.warn('  - 总时长:', data.details.totalduration);
          }
        });

        hlsRef.current = hls;

        // ⭐ 诊断：监听视频事件
        video.addEventListener('ended', () => {
          console.warn('❌ 视频播放结束事件触发！');
          console.warn('  - 这可能是 VOD（点播）而不是直播流');
          console.warn('  - 或者 m3u8 没有持续更新');
          setBufferInfo('❌ 播放已结束（非直播流？）');
        });

        video.addEventListener('stalled', () => {
          console.warn('⚠️ 视频播放卡住 (stalled)');
          setBufferInfo('⏳ 缓冲中...');
          setTimeout(() => setBufferInfo(''), 3000);
        });

        video.addEventListener('waiting', () => {
          console.log('⏳ 视频等待数据 (waiting)');
          setBufferInfo('⏳ 加载中...');
          setTimeout(() => setBufferInfo(''), 3000);
        });

        video.addEventListener('playing', () => {
          console.log('▶️ 视频正在播放');
          setBufferInfo('');
        });

        video.addEventListener('pause', () => {
          console.log('⏸️ 视频已暂停');
        });

        // ⭐ 完全移除播放进度监控 - 让 HLS.js 自己处理
        // x-iptv-player 没有任何播放监控逻辑，只依赖 HLS.js 的内置机制
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari 原生支持 HLS
          video.src = processedUrl;
          video.addEventListener("loadedmetadata", () => {
            video.play().catch((err) => {
              console.error("播放失败:", err);
              setError("自动播放失败，请点击播放按钮");
            });
            setLoading(false);
          });
        } else {
          setError("当前浏览器不支持 HLS 播放");
          setLoading(false);
        }
    } else {
      // 普通视频流
        video.src = processedUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((err) => {
            console.error("播放失败:", err);
            setError("自动播放失败，请点击播放按钮");
          });
          setLoading(false);
        });
      }
    };

    // 调用异步加载函数
    loadVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [channel]);

  const handleManualPlay = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      // 先静音播放以符合浏览器策略
      video.muted = true;

      video.play().then(() => {
        console.log("✅ 手动播放成功");
        setError(null);
        // 播放成功后立即取消静音
        setTimeout(() => {
          video.muted = false;
          console.log("🔊 已取消静音");
        }, 100);
      }).catch((err) => {
        console.error("❌ 手动播放失败:", err);
        setError(`播放失败: ${err.message}`);
      });
    }
  };

  return (
    <div className="video-player" style={{ position: "relative" }}>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{ display: error ? "none" : "block" }}
      />
      {loading && !error && channel && (
        <div className="video-error">
          <p>正在加载 {channel.name}...</p>
          {bufferInfo && <p style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>{bufferInfo}</p>}
        </div>
      )}
      {!loading && !error && bufferInfo && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          zIndex: 100,
          pointerEvents: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
        }}>
          {bufferInfo}
        </div>
      )}
      {!channel && (
        <div className="video-error">
          <p>请选择一个频道开始播放</p>
          <p style={{ fontSize: "14px", marginTop: "10px", opacity: 0.7 }}>
            👈 从左侧选择订阅源和频道
          </p>
        </div>
      )}
      {error && channel && (
        <div className="video-error">
          <p>{error}</p>
          <p style={{ fontSize: "14px", marginTop: "10px", opacity: 0.7 }}>
            频道: {channel.name}
          </p>
          <button
            onClick={handleManualPlay}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px"
            }}
          >
            点击播放
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
