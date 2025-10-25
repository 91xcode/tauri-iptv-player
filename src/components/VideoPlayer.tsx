import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { Channel } from "../App";

interface VideoPlayerProps {
  channel: Channel;
}

function VideoPlayer({ channel }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

    // 检查是否是 HLS 流
    if (channel.url.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hls.loadSource(channel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => {
            console.error("播放失败:", err);
            setError("自动播放失败，请点击播放按钮");
          });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS 错误:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("网络错误，正在尝试恢复...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("媒体错误，正在尝试恢复...");
                hls.recoverMediaError();
                break;
              default:
                setError(`播放失败: ${data.type}`);
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari 原生支持 HLS
        video.src = channel.url;
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
      video.src = channel.url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((err) => {
          console.error("播放失败:", err);
          setError("自动播放失败，请点击播放按钮");
        });
        setLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [channel.url]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        autoPlay
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
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
