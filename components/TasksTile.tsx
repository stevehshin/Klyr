"use client";

import { useState, useEffect, useCallback } from "react";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import type { GridMember } from "./Grid";

const STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export interface TasksTileProps {
  tileId: string;
  gridId: string;
  userId: string;
  userEmail: string;
  gridMembers: GridMember[];
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
  visibility: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueAt?: string | null;
  assigneeUserId?: string | null;
  assignee?: { id: string; email: string } | null;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  visibility: string;
  createdByUserId: string;
}

interface TaskComment {
  id: string;
  encryptedContent: string;
  userId: string;
  user?: { id: string; email: string };
  createdAt: string;
}

const UI_STORAGE_KEY = (tileId: string) => `klyr-tasks-ui-${tileId}`;

export function TasksTile({ tileId, gridId, userId, userEmail, gridMembers, onClose }: TasksTileProps) {
  const [viewMode, setViewMode] = useState<"LIST" | "BOARD">("BOARD");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterProject, setFilterProject] = useState<string>("");
  const [filterVisibility, setFilterVisibility] = useState<string>("");
  const [filterDue, setFilterDue] = useState<string>(""); // "", "overdue", "today", "week"
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Persist UI state
  useEffect(() => {
    const key = UI_STORAGE_KEY(tileId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const u = JSON.parse(raw) as { viewMode?: string; filterStatus?: string; filterAssignee?: string; filterProject?: string; filterVisibility?: string; filterDue?: string };
        if (u.viewMode === "LIST" || u.viewMode === "BOARD") setViewMode(u.viewMode);
        if (u.filterStatus != null) setFilterStatus(u.filterStatus);
        if (u.filterAssignee != null) setFilterAssignee(u.filterAssignee);
        if (u.filterProject != null) setFilterProject(u.filterProject);
        if (u.filterVisibility != null) setFilterVisibility(u.filterVisibility);
        if (u.filterDue != null) setFilterDue(u.filterDue);
      }
    } catch {}
  }, [tileId]);

  useEffect(() => {
    const key = UI_STORAGE_KEY(tileId);
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          viewMode,
          filterStatus,
          filterAssignee,
          filterProject,
          filterVisibility,
          filterDue,
        })
      );
    } catch {}
  }, [tileId, viewMode, filterStatus, filterAssignee, filterProject, filterVisibility, filterDue]);

  const fetchProjects = useCallback(async () => {
    const res = await fetch(`/api/projects?gridId=${encodeURIComponent(gridId)}`);
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects ?? []);
    }
  }, [gridId]);

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams({ gridId });
    if (filterStatus) params.set("status", filterStatus);
    if (filterAssignee && filterAssignee !== "__all__") params.set("assigneeUserId", filterAssignee);
    if (filterProject) params.set("projectId", filterProject);
    if (filterVisibility) params.set("visibility", filterVisibility);
    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      let list: Task[] = data.tasks ?? [];
      if (filterDue === "overdue") {
        const now = new Date().toISOString();
        list = list.filter((t: Task) => t.dueAt && t.dueAt < now && t.status !== "DONE");
      } else if (filterDue === "today") {
        const today = new Date().toISOString().slice(0, 10);
        list = list.filter((t: Task) => t.dueAt && t.dueAt.slice(0, 10) === today);
      } else if (filterDue === "week") {
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        list = list.filter((t: Task) => {
          if (!t.dueAt) return false;
          const d = new Date(t.dueAt);
          return d >= now && d <= weekEnd;
        });
      }
      setTasks(list);
    }
  }, [gridId, filterStatus, filterAssignee, filterProject, filterVisibility, filterDue]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchProjects(), fetchTasks()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchProjects, fetchTasks]);

  const createTask = async (payload: {
    title: string;
    description?: string;
    status?: string;
    assigneeUserId?: string | null;
    projectId?: string | null;
    visibility?: string;
    dueAt?: string | null;
    calendarEventId?: string | null;
  }) => {
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gridId,
          ...payload,
          visibility: payload.visibility ?? "SHARED",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
        setQuickAddTitle("");
        return data.task;
      }
    } finally {
      setCreating(false);
    }
    return null;
  };

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      if (detailTaskId === taskId) setDetailTask(data.task);
      return data.task;
    }
    return null;
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (detailTaskId === taskId) setDetailTaskId(null);
      setDetailTask(null);
    }
  };

  const fetchComments = useCallback(async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? []);
    }
  }, []);

  useEffect(() => {
    if (detailTaskId) {
      const t = tasks.find((x) => x.id === detailTaskId);
      setDetailTask(t ?? null);
      fetchComments(detailTaskId);
    } else {
      setDetailTask(null);
      setComments([]);
    }
  }, [detailTaskId, tasks, fetchComments]);

  const addComment = async () => {
    if (!detailTaskId || !newComment.trim()) return;
    try {
      const encrypted = await encryptMessage(newComment.trim());
      const res = await fetch(`/api/tasks/${detailTaskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedContent: encrypted }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch (e) {
      console.error("Encrypt comment failed", e);
    }
  };

  // Swim lanes: Unassigned, Me, then other members (by gridMembers order)
  const assigneeLanes = [
    { id: "__unassigned__", label: "Unassigned" },
    { id: userId, label: "Me" },
    ...gridMembers.filter((m) => m.id !== userId).map((m) => ({ id: m.id, label: m.displayName })),
  ];

  const handleDrop = async (taskId: string, newStatus: string, newAssigneeUserId: string | null) => {
    await updateTask(taskId, { status: newStatus, assigneeUserId: newAssigneeUserId || undefined });
  };

  const handleCreateLoop = (task: Task) => {
    window.dispatchEvent(
      new CustomEvent("klyr-create-loop-from-task", {
        detail: { taskId: task.id, title: task.title, gridId },
      })
    );
  };

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Projects & Tasks</h3>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewMode("BOARD")}
              className={`px-2 py-1 text-xs font-medium ${viewMode === "BOARD" ? "bg-primary-600 text-white" : "bg-transparent text-gray-600 dark:text-gray-400"}`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`px-2 py-1 text-xs font-medium ${viewMode === "LIST" ? "bg-primary-600 text-white" : "bg-transparent text-gray-600 dark:text-gray-400"}`}
            >
              List
            </button>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {viewMode === "LIST" && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Add task..."
              className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <button
              onClick={async () => {
                if (quickAddTitle.trim()) await createTask({ title: quickAddTitle.trim() });
              }}
              disabled={creating || !quickAddTitle.trim()}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
            >
              Add
            </button>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="__all__">All assignees</option>
              {assigneeLanes.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <select
              value={filterDue}
              onChange={(e) => setFilterDue(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Any due</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
            </select>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">All visibility</option>
              <option value="PRIVATE">Private</option>
              <option value="SHARED">Shared</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
        ) : viewMode === "BOARD" ? (
          <div className="flex-1 overflow-auto p-2">
            <BoardView
              tasks={tasks}
              assigneeLanes={assigneeLanes}
              onCreateTask={(assigneeUserId) => {
                const title = quickAddTitle.trim() || "New task";
                createTask({
                  title,
                  assigneeUserId: assigneeUserId === "__unassigned__" ? null : assigneeUserId,
                }).then(() => setQuickAddTitle(""));
              }}
              onTaskClick={setDetailTaskId}
              onDrop={handleDrop}
              creating={creating}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Title</th>
                  <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Assignee</th>
                  <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Due</th>
                  <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Priority</th>
                  <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Project</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setDetailTaskId(task.id)}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  >
                    <td className="p-2 text-gray-900 dark:text-white">{task.title}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">{STATUS_LABELS[task.status] ?? task.status}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">
                      {task.assigneeUserId === userId ? "Me" : task.assignee?.email?.split("@")[0] ?? "—"}
                    </td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">{task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "—"}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">{PRIORITY_LABELS[task.priority] ?? task.priority}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">{task.project?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">No tasks. Add one above or switch to Board.</p>
            )}
          </div>
        )}
      </div>

      {detailTaskId && (
        <TaskDetailDrawer
          task={detailTask}
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={addComment}
          onClose={() => setDetailTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          userId={userId}
          gridMembers={gridMembers}
          projects={projects}
          onCreateLoop={handleCreateLoop}
          decryptMessage={decryptMessage}
        />
      )}
    </div>
  );
}

function BoardView({
  tasks,
  assigneeLanes,
  onCreateTask,
  onTaskClick,
  onDrop,
  creating,
}: {
  tasks: Task[];
  assigneeLanes: { id: string; label: string }[];
  onCreateTask: (assigneeUserId: string | null) => void;
  onTaskClick: (taskId: string) => void;
  onDrop: (taskId: string, newStatus: string, newAssigneeUserId: string | null) => Promise<void>;
  creating: boolean;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ status: string; assigneeId: string } | null>(null);

  const assigneeIdToKey = (id: string) => (id === "__unassigned__" ? null : id);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragging(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => {
    setDragging(null);
    setDropTarget(null);
  };
  const handleDragOver = (e: React.DragEvent, status: string, assigneeId: string) => {
    e.preventDefault();
    setDropTarget({ status, assigneeId });
  };
  const handleDragLeave = () => {
    setDropTarget(null);
  };
  const handleDrop = (e: React.DragEvent, status: string, assigneeId: string) => {
    e.preventDefault();
    setDropTarget(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    const newAssignee = assigneeId === "__unassigned__" ? null : assigneeId;
    onDrop(taskId, status, newAssignee);
    setDragging(null);
  };

  return (
    <div className="space-y-4">
      {assigneeLanes.map((lane) => (
        <div key={lane.id} className="bg-gray-50/80 dark:bg-gray-900/50 rounded-lg p-2">
          <div className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center justify-between">
            <span>{lane.label}</span>
            <button
              type="button"
              onClick={() => onCreateTask(assigneeIdToKey(lane.id))}
              disabled={creating}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              + Add task
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STATUSES.map((status) => {
              const cellTasks = tasks.filter(
                (t) =>
                  (lane.id === "__unassigned__" ? !t.assigneeUserId : t.assigneeUserId === lane.id) &&
                  t.status === status
              );
              const isDrop = dropTarget?.status === status && dropTarget?.assigneeId === lane.id;
              return (
                <div
                  key={status}
                  onDragOver={(e) => handleDragOver(e, status, lane.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status, lane.id)}
                  className={`w-48 flex-shrink-0 rounded-lg border-2 min-h-[80px] p-2 ${isDrop ? "border-primary-500 bg-primary-500/10" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{STATUS_LABELS[status]}</div>
                  {cellTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick(task.id)}
                      className={`mb-2 p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing ${dragging === task.id ? "opacity-50" : ""}`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {PRIORITY_LABELS[task.priority]} {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskDetailDrawer({
  task,
  comments,
  newComment,
  setNewComment,
  onAddComment,
  onClose,
  onUpdate,
  onDelete,
  userId,
  gridMembers,
  projects,
  onCreateLoop,
  decryptMessage,
}: {
  task: Task | null;
  comments: TaskComment[];
  newComment: string;
  setNewComment: (v: string) => void;
  onAddComment: () => void;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Task>) => Promise<unknown>;
  onDelete: (id: string) => void;
  userId: string;
  gridMembers: GridMember[];
  projects: Project[];
  onCreateLoop: (task: Task) => void;
  decryptMessage: (enc: string) => Promise<string>;
}) {
  const [decryptedComments, setDecryptedComments] = useState<{ id: string; text: string; email: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      comments.map(async (c) => {
        try {
          const text = await decryptMessage(c.encryptedContent);
          return { id: c.id, text, email: c.user?.email ?? "" };
        } catch {
          return { id: c.id, text: "[encrypted]", email: c.user?.email ?? "" };
        }
      })
    ).then((list) => {
      if (!cancelled) setDecryptedComments(list);
    });
    return () => { cancelled = true; };
  }, [comments, decryptMessage]);

  if (!task) return null;
  const assigneeOptions = [
    { id: "", label: "Unassigned" },
    ...gridMembers.map((m) => ({ id: m.id, label: m.displayName })),
  ];

  return (
    <div className="absolute inset-0 z-10 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white">Task details</h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" aria-label="Close">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Title</label>
          <input
            type="text"
            defaultValue={task.title}
            onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== task.title) onUpdate(task.id, { title: v }); }}
            className="w-full mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
          <textarea
            defaultValue={task.description ?? ""}
            onBlur={(e) => onUpdate(task.id, { description: e.target.value.trim() || undefined })}
            className="w-full mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm min-h-[60px]"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
            <select
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value })}
              className="mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Priority</label>
            <select
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
              className="mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Due</label>
            <input
              type="date"
              value={task.dueAt ? task.dueAt.slice(0, 10) : ""}
              onChange={(e) => onUpdate(task.id, { dueAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Assignee</label>
            <select
              value={task.assigneeUserId ?? ""}
              onChange={(e) => onUpdate(task.id, { assigneeUserId: e.target.value || null })}
              className="mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              {assigneeOptions.map((o) => (
                <option key={o.id || "u"} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Visibility</label>
            <div className="mt-1 flex items-center gap-1">
              <span className={task.visibility === "PRIVATE" ? "text-amber-500" : "text-gray-400"} title={task.visibility}>🔒</span>
              <select
                value={task.visibility}
                onChange={(e) => onUpdate(task.id, { visibility: e.target.value })}
                className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="PRIVATE">Private</option>
                <option value="SHARED">Shared</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Project</label>
            <select
              value={task.projectId ?? ""}
              onChange={(e) => onUpdate(task.id, { projectId: e.target.value || null })}
              className="mt-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Comments</span>
            <button
              type="button"
              onClick={() => onCreateLoop(task)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Create Loop
            </button>
          </div>
          <div className="space-y-2 mb-2">
            {decryptedComments.map((c) => (
              <div key={c.id} className="text-sm p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                <span className="text-xs text-gray-500 dark:text-gray-400">{c.email.split("@")[0]}</span>: {c.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <button onClick={onAddComment} disabled={!newComment.trim()} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50">Post</button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Delete task
        </button>
      </div>
    </div>
  );
}
