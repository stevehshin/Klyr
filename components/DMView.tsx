"use client";

import { useState, useEffect, useRef } from "react";
import {
  encryptMessage,
  decryptMessage,
  getEncryptionKey,
  generateEncryptionKey,
} from "@/lib/crypto";
import { openCallInNewWindow } from "@/lib/call/open-call-window";

export interface DMViewProps {
  tileId: string;
  conversationId: string;
  conversationName: string;
  onGrid: boolean;
  gridId: string;
  onAddToGrid: () => void;
  userEmail?: string;
}

interface Message {
  id: string;
  encryptedContent: string;
  createdAt: string;
  user?: { email: string };
  decryptedContent?: string;
  decryptError?: boolean;
}

export function DMView({
  tileId,
  conversationId,
  conversationName,
  onGrid,
  onAddToGrid,
  userEmail,
}: DMViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [addingToGrid, setAddingToGrid] = useState(false);
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

  const handleAddToGrid = async () => {
    setAddingToGrid(true);
    try {
      const res = await fetch(`/api/tiles/${tileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onGrid: true }),
      });
      if (res.ok) onAddToGrid();
    } catch (err) {
      console.error("Failed to add to grid:", err);
    } finally {
      setAddingToGrid(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg" aria-hidden>💬</span>
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 dark:text-white truncate">
              {conversationName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Direct message · End-to-end encrypted</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!onGrid && (
            <button
              type="button"
              onClick={handleAddToGrid}
              disabled={addingToGrid}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              {addingToGrid ? "…" : "Add to grid"}
            </button>
          )}
          <button
            type="button"
            onClick={() => openCallInNewWindow(conversationId, `Call with ${conversationName}`, userEmail)}
            className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Start call"
            title="Call"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet. Say hello.</p>
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
        className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-white/80 dark:bg-gray-900/80"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={hasKey ? "Type a message..." : "Generating encryption key..."}
            disabled={!hasKey}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !hasKey}
            className="px-4 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
