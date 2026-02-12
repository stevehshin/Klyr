"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface SelectConversationModalProps {
  onClose: () => void;
  onSelect: (conversationId: string, conversationName: string) => void;
}

type UserOption = { id: string; email: string };

export function SelectConversationModal({ onClose, onSelect }: SelectConversationModalProps) {
  const [type, setType] = useState<"direct" | "group">("direct");
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  useEffect(() => {
    if (type !== "direct") return;
    let cancelled = false;
    setUsersLoading(true);
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (!cancelled) setUsers(data.users || []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const filteredUsers = userSearch.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  const handleSelectUser = (user: UserOption) => {
    onSelect(user.id, user.email);
    onClose();
  };

  const handleCreate = () => {
    if (type === "direct") {
      const email = participants.trim();
      if (email) {
        onSelect(`email-${email}`, email);
        onClose();
      }
      return;
    }
    const participantList = participants.split(",").map((p) => p.trim()).filter(Boolean);
    const conversationId = `${type}-${Date.now()}`;
    const conversationName = name || "Group Chat";
    onSelect(conversationId, conversationName);
    onClose();
  };

  const canAddDirect = type === "direct" && (showEmailFallback ? participants.trim().length > 0 : false);
  const canAddGroup = type === "group" && participants.trim().length > 0;
  const canSubmit = type === "direct" ? canAddDirect : canAddGroup;

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {type === "direct" ? "New DM" : "Select Conversation"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                  onChange={(e) => {
                    setType(e.target.value as "direct" | "group");
                    setShowEmailFallback(false);
                  }}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Direct Message</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">One-on-one with a user</p>
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

          {type === "direct" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose a user
                </label>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {usersLoading ? (
                  <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">Loading users…</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                    {users.length === 0 ? "No other users in the system." : "No matching users."}
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-900 dark:text-white"
                    >
                      {user.email}
                    </button>
                  ))
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowEmailFallback(!showEmailFallback)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showEmailFallback ? "Hide email field" : "Or enter email address"}
                </button>
                {showEmailFallback && (
                  <div className="mt-2">
                    <input
                      type="email"
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use this if the person is not yet registered.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {type === "group" && (
            <>
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
              <div>
                <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participant Emails
                </label>
                <input
                  type="text"
                  id="participants"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Cancel
          </button>
          {(type === "group" || (type === "direct" && showEmailFallback)) && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canSubmit}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Grid
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
