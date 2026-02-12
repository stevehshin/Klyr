"use client";

import { useState, useEffect, useRef } from "react";
import {
  encryptMessage,
  decryptMessage,
  getEncryptionKey,
  generateEncryptionKey,
} from "@/lib/crypto";

export interface ChannelTileProps {
  tileId: string;
  channelId: string;
  channelName: string;
  channelEmoji: string;
  onClose: () => void;
}

interface Message {
  id: string;
  encryptedContent: string;
  createdAt: string;
  user: {
    email: string;
  };
  decryptedContent?: string;
  decryptError?: boolean;
}

export function ChannelTile({
  tileId,
  channelId,
  channelName,
  channelEmoji,
  onClose,
}: ChannelTileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for encryption key
  useEffect(() => {
    const checkKey = async () => {
      let key = getEncryptionKey();
      if (!key) {
        key = await generateEncryptionKey();
      }
      setHasKey(!!key);
    };
    checkKey();
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!hasKey) return;

      try {
        const response = await fetch(`/api/channels/${channelId}/messages`);
        if (response.ok) {
          const data = await response.json();
          const messagesWithDecryption = await Promise.all(
            data.messages.map(async (msg: Message) => {
              try {
                const decrypted = await decryptMessage(msg.encryptedContent);
                return { ...msg, decryptedContent: decrypted };
              } catch (error) {
                return { ...msg, decryptError: true };
              }
            })
          );
          setMessages(messagesWithDecryption);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [channelId, hasKey]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !hasKey) return;

    setSending(true);

    try {
      const encrypted = await encryptMessage(newMessage);

      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          encryptedContent: encrypted,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            decryptedContent: newMessage,
          },
        ]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xl flex-shrink-0">{channelEmoji}</span>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            #{channelName}
          </h3>
          <span className="tile-encrypted flex-shrink-0" title="End-to-end encrypted">
            <span aria-hidden>🔐</span>
            <span className="hidden sm:inline">Encrypted</span>
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          aria-label="Close tile"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg mb-1">{channelEmoji}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No messages yet
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {msg.user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                    {msg.user.email}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.decryptError ? (
                  <p className="text-red-600 dark:text-red-400 text-xs">
                    ⚠️ Unable to decrypt
                  </p>
                ) : (
                  <p className="text-gray-900 dark:text-white text-sm break-words">
                    {msg.decryptedContent}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-800 flex-shrink-0"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channelName}`}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!hasKey || sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !hasKey || sending}
            className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
