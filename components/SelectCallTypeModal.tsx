"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { SelectChannelModal } from "./SelectChannelModal";
import { SelectConversationModal } from "./SelectConversationModal";

export interface CallTileMetadata {
  roomId: string;
  roomLabel: string;
  channelId?: string;
  channelName?: string;
  channelEmoji?: string;
  conversationId?: string;
  conversationName?: string;
}

export interface SelectCallTypeModalProps {
  gridId: string;
  onClose: () => void;
  onSelect: (metadata: CallTileMetadata) => void;
}

export function SelectCallTypeModal({ gridId, onClose, onSelect }: SelectCallTypeModalProps) {
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);

  const handleRoomSelect = () => {
    onSelect({ roomId: gridId, roomLabel: "Grid call" });
    onClose();
  };

  const handleChannelSelect = (channelId: string, channelName: string, channelEmoji: string) => {
    onSelect({
      roomId: channelId,
      roomLabel: `${channelEmoji} #${channelName}`,
      channelId,
      channelName,
      channelEmoji,
    });
    setShowChannelModal(false);
    onClose();
  };

  const handleDMSelect = (conversationId: string, conversationName: string) => {
    onSelect({
      roomId: conversationId,
      roomLabel: `Call with ${conversationName}`,
      conversationId,
      conversationName,
    });
    setShowDMModal(false);
    onClose();
  };

  if (showChannelModal) {
    return (
      <SelectChannelModal
        onClose={() => setShowChannelModal(false)}
        onSelect={handleChannelSelect}
      />
    );
  }

  if (showDMModal) {
    return (
      <SelectConversationModal
        onClose={() => setShowDMModal(false)}
        onSelect={handleDMSelect}
      />
    );
  }

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add call tile</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose the type of call for this tile:
        </p>

        <div className="space-y-2">
          <button
            onClick={handleRoomSelect}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">📹</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Grid call</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Call for everyone on this grid</p>
            </div>
          </button>

          <button
            onClick={() => setShowChannelModal(true)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">📢</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Channel call</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Call with channel members</p>
            </div>
          </button>

          <button
            onClick={() => setShowDMModal(true)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">1:1 call</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Call a specific person</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
