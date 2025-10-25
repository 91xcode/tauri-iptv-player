import { useState, useMemo } from "react";
import type { Channel } from "../App";

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

function ChannelList({ channels, selectedChannel, onSelectChannel }: ChannelListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // 按分组整理频道
  // @ts-ignore - 保留用于未来功能
  const groupedChannels = useMemo(() => {
    const groups: { [key: string]: Channel[] } = {};

    channels.forEach((channel) => {
      const group = channel.group || "未分组";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(channel);
    });

    return groups;
  }, [channels]);

  // 过滤频道
  const filteredChannels = useMemo(() => {
    if (!searchTerm.trim()) {
      return channels;
    }

    const term = searchTerm.toLowerCase();
    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(term) ||
      channel.group?.toLowerCase().includes(term)
    );
  }, [channels, searchTerm]);

  // 过滤后的分组
  const filteredGroups = useMemo(() => {
    const groups: { [key: string]: Channel[] } = {};

    filteredChannels.forEach((channel) => {
      const group = channel.group || "未分组";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(channel);
    });

    return groups;
  }, [filteredChannels]);

  return (
    <>
      <div className="channel-list-header">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 搜索频道..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="clear-search-btn"
              title="清空搜索"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="channel-list-content">
        {filteredChannels.length === 0 ? (
          <div className="empty-channels">
            <p>没有找到匹配的频道</p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([groupName, groupChannels]) => (
            <div key={groupName} className="channel-group">
              <div className="channel-group-title">{groupName}</div>
              {groupChannels.map((channel, index) => (
                <div
                  key={`${groupName}-${index}`}
                  className={`channel-list-item ${
                    selectedChannel?.url === channel.url ? "active" : ""
                  }`}
                  onClick={() => onSelectChannel(channel)}
                  title={channel.url}
                >
                  <div className="channel-icon">
                    {channel.url.includes('[') && channel.url.includes(']') ? '🌐' : '📺'}
                  </div>
                  <div className="channel-info">
                    <div className="channel-name">
                      {channel.name}
                      {channel.url.includes('[') && channel.url.includes(']') && (
                        <span style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.6 }}>IPv6</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default ChannelList;
