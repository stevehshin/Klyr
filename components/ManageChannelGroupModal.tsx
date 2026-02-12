"use client";

import { useState, useEffect } from "react";

export interface ChannelGroup {
  id: string;
  name: string;
  order: number;
  channels: { id: string; name: string; emoji: string; isPrivate: boolean }[];
}

export interface ChannelInfo {
  id: string;
  name: string;
  emoji: string;
  isPrivate: boolean;
}

export interface ManageChannelGroupModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ManageChannelGroupModal({
  groupId,
  groupName: initialName,
  onClose,
  onUpdate,
}: ManageChannelGroupModalProps) {
  const [name, setName] = useState(initialName);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [groupChannels, setGroupChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, channelsRes] = await Promise.all([
          fetch("/api/channel-groups"),
          fetch("/api/channels"),
        ]);
        if (groupsRes.ok) {
          const gData = await groupsRes.json();
          const group = gData.groups?.find((g: ChannelGroup) => g.id === groupId);
          if (group) {
            setGroupChannels(
              group.channels?.map((c: { id: string; name: string; emoji: string; isPrivate: boolean }) => ({
                id: c.id,
                name: c.name,
                emoji: c.emoji ?? "📢",
                isPrivate: c.isPrivate ?? false,
              })) ?? []
            );
          }
        }
        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(
            (cData.channels ?? []).map((c: { id: string; name: string; emoji: string; isPrivate: boolean }) => ({
              id: c.id,
              name: c.name,
              emoji: c.emoji ?? "📢",
              isPrivate: c.isPrivate ?? false,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

  const addChannel = (ch: ChannelInfo) => {
    if (!groupChannels.some((c) => c.id === ch.id)) {
      setGroupChannels((prev) => [...prev, ch]);
    }
  };

  const removeChannel = (id: string) => {
    setGroupChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/channel-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          channelIds: groupChannels.map((c) => c.id),
        }),
      });
      if (res.ok) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const availableChannels = channels.filter((c) => !groupChannels.some((gc) => gc.id === c.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit group</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Channels in group ({groupChannels.length})
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {groupChannels.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No channels yet</p>
                ) : (
                  groupChannels.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="text-sm">
                        {ch.emoji} {ch.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeChannel(ch.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {availableChannels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add channel
                </label>
                <div className="space-y-1">
                  {availableChannels.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => addChannel(ch)}
                      className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <span>{ch.emoji}</span>
                      <span>{ch.name}</span>
                      <span className="text-primary-500 text-xs">+ Add</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
