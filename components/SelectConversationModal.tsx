"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export interface SelectConversationModalProps {
  onClose: () => void;
  onSelect: (conversationId: string, conversationName: string) => void;
}

export function SelectConversationModal({ onClose, onSelect }: SelectConversationModalProps) {
  const [type, setType] = useState<"direct" | "group">("direct");
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState("");

  const handleCreate = () => {
    const participantList = participants.split(",").map((p) => p.trim()).filter(Boolean);
    const conversationId = `${type}-${Date.now()}`;
    const conversationName = type === "direct" 
      ? participantList[0] || "DM"
      : name || "Group Chat";
    
    onSelect(conversationId, conversationName);
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Conversation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conversation Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="type"
                  value="direct"
                  checked={type === "direct"}
                  onChange={(e) => setType(e.target.value as "direct" | "group")}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Direct Message</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">One-on-one conversation</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="type"
                  value="group"
                  checked={type === "group"}
                  onChange={(e) => setType(e.target.value as "direct" | "group")}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Group Chat</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Multiple participants</p>
                </div>
              </label>
            </div>
          </div>

          {type === "group" && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team Chat"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {type === "direct" ? "Recipient Email" : "Participant Emails"}
            </label>
            <input
              type="text"
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder={type === "direct" ? "user@example.com" : "user1@example.com, user2@example.com"}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {type === "direct" ? "Enter one email address" : "Separate multiple emails with commas"}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!participants.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Grid
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
