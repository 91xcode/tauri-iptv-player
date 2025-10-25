import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { invoke } from "@tauri-apps/api/core";
import type { Channel } from "../App";

interface VideoPlayerProps {
  channel: Channel;
}

function VideoPlayer({ channel }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

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

    // 检查是否是 IPv6 URL
    const isIpv6 = channel.url.includes('[') && channel.url.includes(']');

    // 异步加载视频
    const loadVideo = async () => {
      let processedUrl = channel.url;

      // 如果是 IPv6 URL，使用本地代理服务器
      if (isIpv6 && channel.url.includes(".m3u8")) {
        try {
          console.log("🌐 检测到 IPv6 m3u8，使用本地代理服务器 (http://127.0.0.1:18080)");

          // 获取并处理 m3u8 内容
          const content = await invoke<string>("fetch_and_proxy_m3u8", {
            url: channel.url,
          });

          console.log("✅ 获取 m3u8 内容，大小:", content.length);

          // 处理 m3u8 内容，将所有 HTTP IPv6 URL 转换为本地代理 URL
          const lines = content.split('\n');
          const processedLines = lines.map(line => {
            const trimmed = line.trim();
            // 如果是 HTTP URL（不是注释）
            if (trimmed.startsWith('http://[') || trimmed.startsWith('https://[')) {
              const encodedUrl = encodeURIComponent(trimmed);
              const proxyUrl = `http://127.0.0.1:18080/proxy?url=${encodedUrl}`;
              console.log(`🔄 代理: ${trimmed.substring(0, 60)}...`);
              return proxyUrl;
            }
            return line;
          });

          const processedContent = processedLines.join('\n');
          console.log("📄 处理后的 m3u8 前500字符:");
          console.log(processedContent.substring(0, 500));

          // 创建 Blob URL
          const blob = new Blob([processedContent], { type: "application/vnd.apple.mpegurl" });
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;

          processedUrl = blobUrl;
          console.log("🔄 使用 Blob URL:", processedUrl);
        } catch (err) {
          console.error("❌ 处理失败:", err);
          setError(`IPv6 处理失败: ${err}`);
          setLoading(false);
          return;
        }
      }

      // 检查是否是 HLS 流
      if (processedUrl.includes(".m3u8") || processedUrl.startsWith("blob:")) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });

          console.log("加载 HLS 源:", processedUrl);
          hls.loadSource(processedUrl);
          hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("✅ HLS MANIFEST_PARSED 事件触发");
          console.log("视频信息:", {
            duration: video.duration,
            readyState: video.readyState,
            networkState: video.networkState,
          });

          setLoading(false);

          video.play().then(() => {
            console.log("✅ 视频播放成功");
          }).catch((err) => {
            console.error("❌ 播放失败:", err);
            console.error("错误详情:", err.name, err.message);
            setError("自动播放失败，请点击播放按钮");
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS 错误:", data);
          console.error("错误详情:", {
            type: data.type,
            fatal: data.fatal,
            url: data.url,
            response: data.response,
            reason: data.reason,
          });

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("网络错误 - 可能是 IPv6 连接问题或 CORS 问题");
                setError(`网络错误 (${data.details || '未知'})`);
                // 尝试恢复
                setTimeout(() => {
                  console.log("尝试恢复网络连接...");
                  hls.startLoad();
                }, 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("媒体错误 - 尝试恢复");
                setError("媒体错误，正在尝试恢复...");
                hls.recoverMediaError();
                break;
              default:
                console.error("致命错误:", data.type);
                setError(`播放失败: ${data.details || data.type}`);
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
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
  }, [channel.url]);

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        console.log("✅ 手动播放成功");
        setError(null);
      }).catch((err) => {
        console.error("❌ 手动播放失败:", err);
        setError(`播放失败: ${err.message}`);
      });
    }
  };

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        style={{ display: error ? "none" : "block" }}
      />
      {loading && !error && (
        <div className="video-error">
          <p>正在加载 {channel.name}...</p>
        </div>
      )}
      {error && (
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
