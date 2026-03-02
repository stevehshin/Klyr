"use client";

import { useState, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";

type UserOption = { id: string; email: string; displayName?: string | null; avatarData?: string | null };

export interface ShareGridModalProps {
  gridId: string;
  gridName: string;
  currentUserId?: string;
  onClose: () => void;
}

export function ShareGridModal({ gridId, gridName, currentUserId, onClose }: ShareGridModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [members, setMembers] = useState<{ id: string; email: string; displayName: string; role: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    fetch(`/api/grid/${gridId}/members`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data) => {
        if (!cancelled) setMembers(data.members || []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => { cancelled = true; };
  }, [gridId, success]);

  useEffect(() => {
    if (!currentUserId || !members.length) return;
    const me = members.find((m) => m.id === currentUserId);
    setCanManage(me?.role === "owner" || me?.role === "admin");
  }, [gridId, currentUserId, members]);

  useEffect(() => {
    let cancelled = false;
    setUsersLoading(true);
    fetch("/api/users", { credentials: "include" })
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
  }, []);

  const filteredUsers = userSearch.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
          (u.displayName && u.displayName.toLowerCase().includes(userSearch.toLowerCase()))
      )
    : users;

  const handleSelectUser = (user: UserOption) => {
    setEmail(user.email);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailToUse = email.trim();
    if (!emailToUse) {
      setError("Choose a user or enter an email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/grid/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gridId, email: emailToUse, permission }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Grid shared with ${emailToUse}`);
        setEmail("");
        setUserSearch("");
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError(data.error || "Failed to share grid");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Share &quot;{gridName}&quot;
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleShare} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* People with access */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              People with access
            </label>
            {membersLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
            ) : (
              <ul className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-44 overflow-y-auto">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.displayName || m.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {m.role === "owner" ? (
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Owner</span>
                      ) : canManage ? (
                        <>
                          <select
                            value={m.role}
                            onChange={async (e) => {
                              const newRole = e.target.value as "view" | "edit" | "admin";
                              try {
                                const res = await fetch(`/api/grid/${gridId}/members`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ userId: m.id, permission: newRole }),
                                });
                                if (res.ok) setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: newRole } : x)));
                                else setError((await res.json()).error || "Failed to update");
                              } catch {
                                setError("Failed to update role");
                              }
                            }}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Remove ${m.displayName || m.email} from this grid?`)) return;
                              try {
                                const res = await fetch(`/api/grid/${gridId}/members`, {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ userId: m.id }),
                                });
                                if (res.ok) {
                                  setMembers((prev) => prev.filter((x) => x.id !== m.id));
                                  setSuccess("Member removed");
                                  setTimeout(() => setSuccess(""), 2000);
                                } else setError((await res.json()).error || "Failed to remove");
                              } catch {
                                setError("Failed to remove");
                              }
                            }}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{m.role}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose a Klyr user
            </label>
            <input
              type="text"
              placeholder="Search by email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              {usersLoading ? (
                <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">Loading users…</p>
              ) : filteredUsers.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {users.length === 0 ? "No other users registered yet." : "No matching users."}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm flex items-center gap-2 ${
                      email === user.email
                        ? "bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    <UserAvatar user={user} size="sm" />
                    <span className="truncate">
                      {user.displayName?.trim() || user.email.split("@")[0] || user.email}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowEmailFallback(!showEmailFallback)}
              className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {showEmailFallback ? "Hide email field" : "Or enter email address"}
            </button>
            {showEmailFallback && (
              <div className="mt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use this if the person is not yet registered in Klyr.
                </p>
              </div>
            )}
            {!showEmailFallback && email && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Selected: <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permission Level
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="permission"
                  value="view"
                  checked={permission === "view"}
                  onChange={(e) => setPermission(e.target.value as "view" | "edit" | "admin")}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">View Only</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Can view tiles but not edit</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="permission"
                  value="edit"
                  checked={permission === "edit"}
                  onChange={(e) => setPermission(e.target.value as "view" | "edit" | "admin")}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Can Edit</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Can add, edit, and delete tiles</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="permission"
                  value="admin"
                  checked={permission === "admin"}
                  onChange={(e) => setPermission(e.target.value as "view" | "edit" | "admin")}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Can edit tiles and manage members (assign admin, remove)</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sharing..." : "Share Grid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
