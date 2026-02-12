"use client";

import { useState, useRef, useEffect } from "react";
import { SelectChannelModal } from "./SelectChannelModal";
import { SelectConversationModal } from "./SelectConversationModal";
import { SelectCallTypeModal } from "./SelectCallTypeModal";
import type { CallTileMetadata } from "./SelectCallTypeModal";

export interface TileMenuProps {
  gridId: string;
  onSelectTileType: (type: string, metadata?: { channelId?: string; channelName?: string; channelEmoji?: string; conversationId?: string; conversationName?: string; roomId?: string; roomLabel?: string }) => void;
}

const TILE_TYPES = [
  { id: "notes", name: "Notes", icon: "📝", description: "Quick notes and text" },
  { id: "tasks", name: "Projects & Tasks", icon: "✅", description: "Kanban and list with assignees" },
  { id: "links", name: "Links", icon: "🔗", description: "Bookmarks and URLs" },
  { id: "calendar", name: "Calendar", icon: "📅", description: "Calendar view" },
  { id: "summary", name: "Daily Summary", icon: "✨", description: "AI summary of new grid content" },
  { id: "dm", name: "Messages", icon: "💬", description: "Encrypted direct messages", needsSelection: true },
  { id: "channel", name: "Channel", icon: "📢", description: "Team channel conversation", needsSelection: true },
  { id: "call", name: "Call", icon: "📹", description: "Video call", needsCallSelection: true },
  { id: "loop_room", name: "Loop Room", icon: "🎙", description: "Opt-in voice room (join to talk)" },
];

export function TileMenu({ gridId, onSelectTileType }: TileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  const handleChannelSelect = (channelId: string, channelName: string, channelEmoji: string) => {
    onSelectTileType("channel", { channelId, channelName, channelEmoji });
    setShowChannelModal(false);
    setIsOpen(false);
  };

  const handleDMSelect = (conversationId: string, conversationName: string) => {
    onSelectTileType("dm", { conversationId, conversationName });
    setShowDMModal(false);
    setIsOpen(false);
  };

  const handleCallSelect = (metadata: CallTileMetadata) => {
    onSelectTileType("call", {
      roomId: metadata.roomId,
      roomLabel: metadata.roomLabel,
      channelId: metadata.channelId,
      channelName: metadata.channelName,
      channelEmoji: metadata.channelEmoji,
      conversationId: metadata.conversationId,
      conversationName: metadata.conversationName,
    });
    setShowCallModal(false);
    setIsOpen(false);
  };
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectType = (type: string) => {
    if (type === "dm") {
      setShowDMModal(true);
      setIsOpen(false);
    } else if (type === "channel") {
      setShowChannelModal(true);
      setIsOpen(false);
    } else if (type === "call") {
      setShowCallModal(true);
      setIsOpen(false);
    } else {
      onSelectTileType(type);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
        aria-label="Add tile"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Tile
        <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2 space-y-1">
            {TILE_TYPES.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleSelectType(tile.id)}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{tile.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {tile.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showChannelModal && (
        <SelectChannelModal
          onClose={() => setShowChannelModal(false)}
          onSelect={handleChannelSelect}
        />
      )}
      
      {showDMModal && (
        <SelectConversationModal
          onClose={() => setShowDMModal(false)}
          onSelect={handleDMSelect}
        />
      )}

      {showCallModal && (
        <SelectCallTypeModal
          gridId={gridId}
          onClose={() => setShowCallModal(false)}
          onSelect={handleCallSelect}
        />
      )}
    </div>
  );
}
