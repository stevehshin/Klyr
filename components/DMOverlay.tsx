"use client";

import { useState, useEffect, useRef } from "react";
import {
  encryptMessage,
  decryptMessage,
  getEncryptionKey,
  generateEncryptionKey,
} from "@/lib/crypto";
import { ConversationSelector, Conversation } from "./ConversationSelector";
import { NewConversationModal } from "./NewConversationModal";

export interface DMOverlayProps {
  tileId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  encryptedContent: string;
  createdAt: string;
  decryptedContent?: string;
  decryptError?: boolean;
}

export function DMOverlay({ tileId, onClose }: DMOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [showKeyWarning, setShowKeyWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`klyr-conversations-${tileId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0 && !currentConversation) {
        setCurrentConversation(parsed[0].id);
      }
    }
  }, [tileId, currentConversation]);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(`klyr-conversations-${tileId}`, JSON.stringify(conversations));
    }
  }, [conversations, tileId]);

  // Check for encryption key and generate if needed
  useEffect(() => {
    const checkKey = async () => {
      let key = getEncryptionKey();
      if (!key) {
        // Generate new key
        key = await generateEncryptionKey();
        setShowKeyWarning(true);
      }
      setHasKey(!!key);
    };
    checkKey();
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?tileId=${tileId}`);
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

    if (hasKey) {
      fetchMessages();
    }
  }, [tileId, hasKey]);

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
      // Encrypt message client-side
      const encrypted = await encryptMessage(newMessage);

      // Send to server
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tileId,
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

  const handleNewConversation = (name: string, type: "direct" | "group", participants: string[]) => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      name,
      type,
      participants,
    };
    setConversations((prev) => [...prev, newConv]);
    setCurrentConversation(newConv.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex">
        {/* Conversation Selector */}
        <ConversationSelector
          conversations={conversations}
          currentConversation={currentConversation}
          onSelect={setCurrentConversation}
          onNewConversation={() => setShowNewConversationModal(true)}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentConversation
                ? conversations.find((c) => c.id === currentConversation)?.name || "Messages"
                : "Select a conversation"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close overlay"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

        {/* Encryption Key Warning */}
        {showKeyWarning && (
          <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-400 dark:border-yellow-600">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              🔐 New encryption key generated. Save your Grid link (with #k=...)
              to access messages from other devices.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                No messages yet. Start a conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
              >
                {msg.decryptError ? (
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    ⚠️ Unable to decrypt this message. Encryption key may be
                    missing or incorrect.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-900 dark:text-white">
                      {msg.decryptedContent}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="border-t border-gray-200 dark:border-gray-700 px-6 py-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!hasKey || sending}
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !hasKey || sending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          {!hasKey && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Encryption key not available. Please refresh the page.
            </p>
          )}
        </form>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onCreate={handleNewConversation}
        />
      )}
    </div>
  );
}
