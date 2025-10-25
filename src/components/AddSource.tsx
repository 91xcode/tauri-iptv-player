import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import "../AddSourceStyles.css";
import type { Source } from "../App";

interface AddSourceProps {
  onAdd: (name: string, url: string) => void;
  onClose: () => void;
  initialSource?: Source | null;
}

function AddSource({ onAdd, onClose, initialSource }: AddSourceProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<"url" | "file">("url");
  const [loading, setLoading] = useState(false);
  const [filePath, setFilePath] = useState(""); // 保存原始文件路径
  const isEditMode = !!initialSource;

  // 编辑模式：初始化表单数据
  useEffect(() => {
    if (initialSource) {
      console.log("========================================");
      console.log("🔄 编辑模式初始化");
      console.log("订阅源名称:", initialSource.name);
      console.log("订阅源 URL 类型:", initialSource.url.startsWith("FILE_CONTENT:") ? "本地文件" : "网络地址");
      console.log("订阅源 URL 长度:", initialSource.url.length);
      console.log("文件路径:", initialSource.filePath);
      console.log("========================================");

      setName(initialSource.name);
      setUrl(initialSource.url);

      // 从 URL 中提取文件路径
      if (initialSource.url.startsWith("FILE_CONTENT:")) {
        setSourceType("file");

        // 格式: FILE_CONTENT:<file_path>:#EXTM3U...
        // 文件路径不会包含 #，所以找到第一个 # 之前的内容就是路径
        const withoutPrefix = initialSource.url.substring("FILE_CONTENT:".length);

        // 查找 M3U 文件开头标记 #EXTM3U
        const contentStartMarker = withoutPrefix.indexOf('#EXTM3U');
        if (contentStartMarker > 0) {
          // 提取路径部分（去掉最后的冒号）
          const pathWithColon = withoutPrefix.substring(0, contentStartMarker);
          const extractedPath = pathWithColon.endsWith(':')
            ? pathWithColon.substring(0, pathWithColon.length - 1)
            : pathWithColon;
          setFilePath(extractedPath);
          console.log("📁 提取的文件路径:", extractedPath);
        } else if (initialSource.filePath) {
          setFilePath(initialSource.filePath);
        } else {
          // 旧数据格式，没有路径信息
          setFilePath("(旧数据，无路径信息)");
          console.log("⚠️ 旧数据格式，无法提取文件路径");
        }
      } else {
        setSourceType("url");
        setFilePath("");
      }
    }
  }, [initialSource]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("========================================");
    console.log("🚀 handleSubmit 被调用");
    console.log("名称:", name);
    console.log("URL 长度:", url.length);
    console.log("URL 前缀:", url.substring(0, 50));

    if (name.trim() && url.trim()) {
      console.log("✅ 验证通过，调用 onAdd");
      onAdd(name.trim(), url.trim());
    } else {
      console.log("❌ 验证失败");
      console.log("name.trim():", name.trim());
      console.log("url.trim():", url.trim());
    }
    console.log("========================================");
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

        // 保存文件路径
        setFilePath(selected);
        console.log("💾 文件路径已保存:", selected);

        // 读取文件内容
        const content = await readTextFile(selected);
        console.log("✅ 文件读取成功");
        console.log("📊 文件大小:", content.length, "字符");
        console.log("📝 文件内容预览:", content.substring(0, 100));

        // 使用特殊标记，告诉后端这是文件内容
        // 格式: FILE_CONTENT:<file_path>:<content>
        setUrl(`FILE_CONTENT:${selected}:${content}`);
        console.log("✅ URL 已设置（包含文件路径）");

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
    } catch (error: unknown) {
      console.error("❌ 选择文件时发生错误");
      console.error("错误类型:", (error as Error)?.constructor?.name);
      console.error("错误消息:", (error as Error)?.message || error);
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
        <h2>{isEditMode ? "编辑订阅源" : "添加订阅源"}</h2>
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

          {/* 显示订阅源地址信息 - 编辑模式或已选择时显示 */}
          {(isEditMode || (sourceType === "file" && filePath) || (sourceType === "url" && url && !url.startsWith("FILE_CONTENT:"))) && (
            <div className="form-group">
              <label>订阅源地址</label>
              <div style={{
                padding: "12px",
                background: "rgba(74, 158, 255, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(74, 158, 255, 0.3)",
                fontSize: "13px",
                color: "#ccc",
                wordBreak: "break-all",
                position: "relative"
              }}>
                {url.startsWith("FILE_CONTENT:") || (sourceType === "file" && filePath) ? (
                  <div>
                    <div style={{ marginBottom: "8px", color: "#4a9eff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>📁 <strong>本地文件路径</strong></span>
                      {filePath && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(filePath);
                            alert("文件路径已复制到剪贴板！");
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            background: "#4a9eff",
                            border: "none",
                            borderRadius: "4px",
                            color: "white",
                            cursor: "pointer"
                          }}
                        >
                          📋 复制
                        </button>
                      )}
                    </div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      opacity: 0.8,
                      padding: "8px",
                      background: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "4px",
                      userSelect: "all",
                      cursor: "text"
                    }}>
                      {filePath || "本地 M3U 文件内容"}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: "8px", color: "#4a9eff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>🌐 <strong>网络地址</strong></span>
                      {url && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(url);
                            alert("网络地址已复制到剪贴板！");
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            background: "#4a9eff",
                            border: "none",
                            borderRadius: "4px",
                            color: "white",
                            cursor: "pointer"
                          }}
                        >
                          📋 复制
                        </button>
                      )}
                    </div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      opacity: 0.8,
                      padding: "8px",
                      background: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "4px",
                      userSelect: "all",
                      cursor: "text"
                    }}>
                      {url}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                placeholder={isEditMode && url.startsWith("FILE_CONTENT:") ? "此订阅源来自本地文件" : "https://example.com/playlist.m3u"}
                required={!url.startsWith("FILE_CONTENT:")}
                disabled={isEditMode && url.startsWith("FILE_CONTENT:")}
                style={{ opacity: isEditMode && url.startsWith("FILE_CONTENT:") ? 0.5 : 1 }}
              />
              {isEditMode && url.startsWith("FILE_CONTENT:") && (
                <div style={{ marginTop: "8px", padding: "8px", background: "rgba(74, 158, 255, 0.1)", borderRadius: "4px", fontSize: "12px", color: "#4a9eff" }}>
                  📁 此订阅源来自<strong>本地文件</strong>，请切换到"📁 本地文件"标签查看详情
                </div>
              )}
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
                <div style={{ marginTop: "12px", padding: "12px", background: "rgba(74, 158, 255, 0.15)", borderRadius: "6px", border: "1px solid rgba(74, 158, 255, 0.3)" }}>
                  <div style={{ fontSize: "13px", color: "#4a9eff", marginBottom: "8px" }}>
                    📦 <strong>文件内容已加载</strong>
                  </div>
                  {!isEditMode && (
                    <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "8px", padding: "8px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "4px" }}>
                      <div style={{ marginBottom: "4px", opacity: 0.7 }}>📁 来源类型:</div>
                      <div style={{ fontFamily: "monospace" }}>本地 M3U 文件内容</div>
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "4px" }}>
                    📊 文件大小: <strong>{(url.length - 13).toLocaleString()}</strong> 字符
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "4px" }}>
                    📺 频道数量: <strong>{initialSource?.channels.length || 0}</strong> 个
                  </div>
                  {isEditMode && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(74, 158, 255, 0.2)", fontSize: "12px", color: "#888" }}>
                      💡 提示: 点击上方按钮可重新选择文件替换当前内容
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              取消
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {isEditMode ? "保存" : "添加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSource;
