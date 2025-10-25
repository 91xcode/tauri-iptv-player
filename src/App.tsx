import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import SourceList from "./components/SourceList";
import ChannelList from "./components/ChannelList";
import VideoPlayer from "./components/VideoPlayer";
import AddSource from "./components/AddSource";
import "./App.css";
import "./CollapseStyles.css";

export interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  channels: Channel[];
}

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [sourceListCollapsed, setSourceListCollapsed] = useState(false);
  const [channelListCollapsed, setChannelListCollapsed] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      console.log("🔄 正在加载订阅源列表...");
      const loadedSources = await invoke<Source[]>("get_sources");
      console.log("📊 获取到订阅源数量:", loadedSources.length);
      console.log("📊 订阅源列表:", loadedSources);

      setSources(loadedSources);
      if (loadedSources.length > 0 && !selectedSource) {
        setSelectedSource(loadedSources[0]);
        console.log("✅ 自动选中第一个订阅源:", loadedSources[0].name);
      }
    } catch (error) {
      console.error("❌ 加载订阅源失败:", error);
    }
  };

  const handleAddSource = async (name: string, url: string) => {
    try {
      console.log("=== 开始添加订阅源 ===");
      console.log("名称:", name);
      console.log("URL:", url);
      console.log("Tauri 环境:", !!window.__TAURI__);

      await invoke("add_source", { name, url });
      console.log("✅ 添加成功，开始加载订阅源列表...");

      await loadSources();
      console.log("✅ 订阅源列表已刷新");

      setShowAddSource(false);
    } catch (error) {
      console.error("❌ 添加订阅源失败:", error);
      console.error("错误类型:", typeof error);
      console.error("错误详情:", error);
      alert(`添加订阅源失败: ${error}`);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await invoke("delete_source", { sourceId });
      await loadSources();
      if (selectedSource?.id === sourceId) {
        setSelectedSource(null);
        setSelectedChannel(null);
      }
    } catch (error) {
      console.error("Failed to delete source:", error);
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  return (
    <div className="app-container">
      {/* 左栏：订阅源管理 */}
      <div className={`source-list-panel ${sourceListCollapsed ? 'collapsed' : ''}`}>
        {!sourceListCollapsed ? (
          <SourceList
            sources={sources}
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
            onDeleteSource={handleDeleteSource}
            onAddSource={() => setShowAddSource(true)}
          />
        ) : null}
        <button
          className="collapse-btn collapse-btn-left"
          onClick={() => setSourceListCollapsed(!sourceListCollapsed)}
          title={sourceListCollapsed ? "展开订阅源列表" : "收起订阅源列表"}
        >
          {sourceListCollapsed ? "›" : "‹"}
        </button>
      </div>

      {/* 中栏：频道列表 + 搜索 */}
      <div className={`channel-list-panel ${channelListCollapsed ? 'collapsed' : ''}`}>
        {!channelListCollapsed ? (
          selectedSource ? (
            <ChannelList
              channels={selectedSource.channels}
              selectedChannel={selectedChannel}
              onSelectChannel={handleSelectChannel}
            />
          ) : (
            <div className="empty-placeholder">
              <p>请先选择订阅源</p>
            </div>
          )
        ) : null}
        <button
          className="collapse-btn collapse-btn-right"
          onClick={() => setChannelListCollapsed(!channelListCollapsed)}
          title={channelListCollapsed ? "展开频道列表" : "收起频道列表"}
        >
          {channelListCollapsed ? "›" : "‹"}
        </button>
      </div>

      {/* 右栏：视频播放器 */}
      <div className="player-panel">
        {selectedChannel ? (
          <VideoPlayer channel={selectedChannel} />
        ) : (
          <div className="player-placeholder">
            <div className="placeholder-content">
              <h2>📺 IPTV 播放器</h2>
              <p>请选择频道开始播放</p>
            </div>
          </div>
        )}
      </div>

      {/* 添加订阅源对话框 */}
      {showAddSource && (
        <AddSource
          onAdd={handleAddSource}
          onClose={() => setShowAddSource(false)}
        />
      )}
    </div>
  );
}

export default App;