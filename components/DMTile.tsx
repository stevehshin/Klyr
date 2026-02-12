"use client";

import { useState, useEffect, useRef } from "react";
import {
  encryptMessage,
  decryptMessage,
  getEncryptionKey,
  generateEncryptionKey,
} from "@/lib/crypto";
import { openCallInNewWindow } from "@/lib/call/open-call-window";

export interface DMTileProps {
  tileId: string;
  conversationId: string;
  conversationName: string;
  userEmail?: string;
  onClose: () => void;
}

interface Message {
  id: string;
  encryptedContent: string;
  createdAt: string;
  user?: { email: string };
  decryptedContent?: string;
  decryptError?: boolean;
}

export function DMTile({ tileId, conversationId, conversationName, userEmail, onClose }: DMTileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchMessages = async () => {
      if (!hasKey) return;
      try {
        const res = await fetch(`/api/messages?tileId=${encodeURIComponent(tileId)}`);
        if (res.ok) {
          const data = await res.json();
          const decrypted = await Promise.all(
            (data.messages || []).map(async (msg: Message) => {
              try {
                const decryptedContent = await decryptMessage(msg.encryptedContent);
                return { ...msg, decryptedContent };
              } catch {
                return { ...msg, decryptError: true };
              }
            })
          );
          setMessages(decrypted);
        }
      } catch (err) {
        console.error("Failed to fetch DM messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [tileId, hasKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !hasKey) return;
    setSending(true);
    try {
      const encrypted = await encryptMessage(newMessage);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileId, encryptedContent: encrypted }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            decryptedContent: newMessage,
          },
        ]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {conversationName}
          </h3>
          <span className="tile-encrypted flex-shrink-0" title="End-to-end encrypted">
            <span aria-hidden>🔐</span>
            <span className="hidden sm:inline">Encrypted</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openCallInNewWindow(conversationId, `Call with ${conversationName}`, userEmail);
            }}
            className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            aria-label="Start call"
            title="Call"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
            aria-label="Close tile"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm">
              {msg.user?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  {msg.user.email.split("@")[0]}
                </p>
              )}
              <p className="text-gray-900 dark:text-white">
                {msg.decryptError ? (
                  <span className="text-red-500 italic">Unable to decrypt</span>
                ) : (
                  msg.decryptedContent
                )}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={hasKey ? "Type a message..." : "Generating encryption key..."}
            disabled={!hasKey}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !hasKey}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
