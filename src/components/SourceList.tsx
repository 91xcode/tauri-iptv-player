import type { Source } from "../App";

interface SourceListProps {
  sources: Source[];
  selectedSource: Source | null;
  onSelectSource: (source: Source) => void;
  onDeleteSource: (sourceId: string) => Promise<void>;
  onEditSource: (source: Source) => void;
  onAddSource: () => void;
}

function SourceList({
  sources,
  selectedSource,
  onSelectSource,
  onDeleteSource,
  onEditSource,
  onAddSource,
}: SourceListProps) {
  return (
    <>
      <div className="source-list-header">
        <h3>订阅源</h3>
        <button onClick={onAddSource} className="add-source-btn" title="添加订阅源">
          ➕
        </button>
      </div>

      <div className="source-list-content">
        {sources.length === 0 ? (
          <div className="empty-sources">
            <p>暂无订阅源</p>
            <button onClick={onAddSource} className="primary-btn">
              添加订阅源
            </button>
          </div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className={`source-item ${selectedSource?.id === source.id ? "active" : ""}`}
              onClick={() => onSelectSource(source)}
            >
              <div className="source-info">
                <div className="source-name">📺 {source.name}</div>
                <div className="source-count">{source.channels.length} 个频道</div>
              </div>
              <div className="source-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("🖊️ 点击编辑按钮，订阅源:", source.name);
                    onEditSource(source);
                  }}
                  className="action-btn edit-btn"
                  title="编辑订阅源"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    console.log("🗑️ 点击删除按钮，订阅源:", source.name, "ID:", source.id);

                    // 在 Tauri 环境中，confirm 返回 Promise，需要 await
                    const confirmed = await window.confirm(`确定删除订阅源 "${source.name}" 吗？\n\n此操作无法撤销！`);
                    console.log(`删除确认结果: ${confirmed}`);
                    console.log(`确认结果类型: ${typeof confirmed}`);

                    if (confirmed === true) {
                      console.log(`✅ 用户确认删除，开始执行删除操作...`);
                      console.log(`调用 onDeleteSource，参数 sourceId:`, source.id);
                      await onDeleteSource(source.id);
                      console.log(`✅ onDeleteSource 调用完成`);
                    } else {
                      console.log(`❌ 用户取消删除操作`);
                    }
                  }}
                  className="action-btn delete-btn"
                  title="删除订阅源"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default SourceList;
