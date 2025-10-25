import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import "../AddSourceStyles.css";

interface AddSourceProps {
  onAdd: (name: string, url: string) => void;
  onClose: () => void;
}

function AddSource({ onAdd, onClose }: AddSourceProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<"url" | "file">("url");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && url.trim()) {
      onAdd(name.trim(), url.trim());
    }
  };

  const handleSelectFile = async () => {
    console.log("========================================");
    console.log("🗂️ handleSelectFile 被调用");

    try {
      setLoading(true);
      console.log("📂 准备打开文件选择对话框");
      console.log("open 函数:", typeof open);
      console.log("readTextFile 函数:", typeof readTextFile);

      // 打开文件选择对话框
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "M3U Playlist",
            extensions: ["m3u", "m3u8"],
          },
        ],
      });

      console.log("📋 文件选择结果:", selected);
      console.log("📋 结果类型:", typeof selected);

      if (selected && typeof selected === "string") {
        console.log("📖 开始读取文件:", selected);

        // 读取文件内容
        const content = await readTextFile(selected);
        console.log("✅ 文件读取成功");
        console.log("📊 文件大小:", content.length, "字符");
        console.log("📝 文件内容预览:", content.substring(0, 100));

        // 使用特殊标记，告诉后端这是文件内容
        setUrl(`FILE_CONTENT:${content}`);
        console.log("✅ URL 已设置");

        // 自动从文件路径提取名称
        const fileName = selected.split("/").pop()?.replace(/\.(m3u8?|txt)$/i, "") || "";
        console.log("📝 提取的文件名:", fileName);

        if (fileName && !name) {
          setName(fileName);
          console.log("✅ 名称已自动填充");
        }

        console.log("✅ 文件处理完成");
      } else if (selected === null) {
        console.log("⚠️ 用户取消了文件选择");
      } else {
        console.log("⚠️ 未知的返回值:", selected);
      }
    } catch (error) {
      console.error("❌ 选择文件时发生错误");
      console.error("错误类型:", error?.constructor?.name);
      console.error("错误消息:", error?.message || error);
      console.error("完整错误:", error);
      alert(`选择文件失败: ${error}`);
    } finally {
      setLoading(false);
      console.log("🔚 handleSelectFile 结束");
      console.log("========================================");
    }
  };

  const handleTestUrl = () => {
    // 使用真实的测试视频流
    setUrl("https://upyun.luckly-mjw.cn/Assets/media-source/example/media/index.m3u8");
    setName("测试视频");
  };

  const handleUseTestData = () => {
    setUrl("TEST_DATA");
    setName("内置测试");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>添加订阅源</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="source-name">订阅源名称</label>
            <input
              id="source-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: CCTV 频道"
              required
            />
          </div>

          {/* 选择类型 */}
          <div className="form-group">
            <label>订阅源类型</label>
            <div className="source-type-tabs">
              <button
                type="button"
                className={`tab-btn ${sourceType === "url" ? "active" : ""}`}
                onClick={() => setSourceType("url")}
              >
                🌐 网络地址
              </button>
              <button
                type="button"
                className={`tab-btn ${sourceType === "file" ? "active" : ""}`}
                onClick={() => setSourceType("file")}
              >
                📁 本地文件
              </button>
            </div>
          </div>

          {/* 网络地址 */}
          {sourceType === "url" && (
            <div className="form-group">
              <label htmlFor="source-url">网络地址</label>
              <input
                id="source-url"
                type="text"
                value={url.startsWith("FILE_CONTENT:") ? "" : url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                required
              />
              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleTestUrl}
                  className="secondary-btn"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  测试地址
                </button>
                <button
                  type="button"
                  onClick={handleUseTestData}
                  className="secondary-btn"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  内置数据
                </button>
              </div>
            </div>
          )}

          {/* 本地文件 */}
          {sourceType === "file" && (
            <div className="form-group">
              <label>选择本地文件</label>
              <button
                type="button"
                onClick={handleSelectFile}
                className="file-select-btn"
                disabled={loading}
              >
                {loading ? "读取中..." : url.startsWith("FILE_CONTENT:") ? "✅ 文件已选择" : "📁 选择 M3U 文件"}
              </button>
              {url.startsWith("FILE_CONTENT:") && (
                <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.7 }}>
                  文件已读取，共 {url.length - 13} 字符
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              取消
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSource;
