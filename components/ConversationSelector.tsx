"use client";

import { useState } from "react";

export interface Conversation {
  id: string;
  name: string;
  type: "direct" | "group";
  participants: string[];
}

export interface ConversationSelectorProps {
  conversations: Conversation[];
  currentConversation: string | null;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationSelector({
  conversations,
  currentConversation,
  onSelect,
  onNewConversation,
}: ConversationSelectorProps) {
  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Conversations</h3>
        <button
          onClick={onNewConversation}
          className="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          title="New conversation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No conversations yet
            </p>
            <button
              onClick={onNewConversation}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  conv.id === currentConversation
                    ? "bg-primary-600 text-white"
                    : "text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {conv.type === "group" ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.name}</p>
                    <p className="text-xs opacity-75 truncate">
                      {conv.type === "group"
                        ? `${conv.participants.length} members`
                        : "Direct message"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
