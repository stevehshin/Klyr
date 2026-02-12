"use client";

import { useState, useEffect, useRef } from "react";
import {
  encryptMessage,
  decryptMessage,
  getEncryptionKey,
  generateEncryptionKey,
} from "@/lib/crypto";
import { EmojiPicker } from "./EmojiPicker";
import { openCallInNewWindow } from "@/lib/call/open-call-window";

export interface ChannelViewProps {
  channelId: string;
  channelName: string;
  channelEmoji: string;
  onAddMembers: () => void;
  userEmail?: string;
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

export function ChannelView({
  channelId,
  channelName,
  channelEmoji,
  onAddMembers,
  userEmail,
}: ChannelViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
                console.error("Failed to decrypt message:", error);
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

  // Scroll to bottom when messages change
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

  const addEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{channelEmoji}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {channelName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCallInNewWindow(channelId, `${channelEmoji} #${channelName}`, userEmail)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-lg transition-colors flex items-center gap-2"
            aria-label="Start channel call"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
            Start call
          </button>
          <button
            onClick={onAddMembers}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Members
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl mb-2">{channelEmoji}</p>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">
                Welcome to #{channelName}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                This is the start of the #{channelName} channel.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {msg.user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {msg.user.email}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {msg.decryptError ? (
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    ⚠️ Unable to decrypt this message
                  </p>
                ) : (
                  <p className="text-gray-900 dark:text-white">{msg.decryptedContent}</p>
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
        className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex-shrink-0"
      >
        <div className="flex gap-2 items-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Add emoji"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0">
                <EmojiPicker
                  value="😊"
                  onChange={addEmoji}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channelName}`}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!hasKey || sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !hasKey || sending}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
