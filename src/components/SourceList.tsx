import type { Source } from "../App";

interface SourceListProps {
  sources: Source[];
  selectedSource: Source | null;
  onSelectSource: (source: Source) => void;
  onDeleteSource: (sourceId: string) => void;
  onAddSource: () => void;
}

function SourceList({
  sources,
  selectedSource,
  onSelectSource,
  onDeleteSource,
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`确定删除订阅源 "${source.name}" 吗？`)) {
                    onDeleteSource(source.id);
                  }
                }}
                className="delete-source-btn"
                title="删除订阅源"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default SourceList;
