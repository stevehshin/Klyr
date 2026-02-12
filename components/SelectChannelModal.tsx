"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface Channel {
  id: string;
  name: string;
  emoji: string;
  isPrivate: boolean;
}

export interface SelectChannelModalProps {
  onClose: () => void;
  onSelect: (channelId: string, channelName: string, channelEmoji: string) => void;
}

export function SelectChannelModal({ onClose, onSelect }: SelectChannelModalProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch("/api/channels");
        if (response.ok) {
          const data = await response.json();
          setChannels(data.channels);
        }
      } catch (error) {
        console.error("Failed to fetch channels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Channel
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

        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Loading channels...</p>
          ) : channels.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No channels available
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create a channel first in the Channels tab
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelect(channel.id, channel.name, channel.emoji)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <span className="text-2xl">{channel.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      #{channel.name}
                    </p>
                  </div>
                  {channel.isPrivate && (
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
