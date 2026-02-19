"use client";

import { useState, useEffect, useCallback } from "react";

export interface CalendarTileProps {
  tileId: string;
  gridId?: string;
  onClose: () => void;
}

interface GridCalendarEvent {
  id: string;
  gridId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  color: string | null;
  createdByUserId: string | null;
  createdBy?: { id: string; email: string } | null;
}

interface TaskWithDue {
  id: string;
  title: string;
  dueAt: string | null;
  priority: string;
  status?: string;
}

type CalendarItem =
  | { type: "event"; id: string; title: string; startAt: Date; endAt: Date; isAllDay: boolean; color: string; description?: string | null; event: GridCalendarEvent }
  | { type: "task"; id: string; title: string; startAt: Date; endAt: Date; isAllDay: true; color: string; taskId: string; priority: string };

const EVENT_COLORS = ["#2563EB", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#0d9488", "#ea580c"];
const TASK_PRIORITY_COLOR: Record<string, string> = { HIGH: "#dc2626", MEDIUM: "#2563EB", LOW: "#6b7280" };

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Returns true if the item touches the given day (for multi-day or single day). */
function itemTouchesDay(item: CalendarItem, year: number, month: number, day: number): boolean {
  const dayStart = new Date(year, month, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
  return item.startAt <= dayEnd && item.endAt >= dayStart;
}

export function CalendarTile({ gridId, onClose }: CalendarTileProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<GridCalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskWithDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GridCalendarEvent | null>(null);
  const [detailItem, setDetailItem] = useState<CalendarItem | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { timeMin, timeMax } = getMonthRange(year, month);

  const fetchData = useCallback(async () => {
    if (!gridId) return;
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        fetch(`/api/grid/calendar?gridId=${encodeURIComponent(gridId)}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`),
        fetch(`/api/tasks?gridId=${encodeURIComponent(gridId)}`),
      ]);
      const eventsData = await eventsRes.json();
      const tasksData = await tasksRes.json();
      if (!eventsRes.ok) throw new Error(eventsData.error || "Failed to load events");
      setEvents(eventsData.events ?? []);
      const allTasks: TaskWithDue[] = tasksData.tasks ?? [];
      const monthStart = new Date(timeMin).getTime();
      const monthEnd = new Date(timeMax).getTime();
      setTasks(
        allTasks.filter((t: TaskWithDue) => {
          if (!t.dueAt) return false;
          const due = new Date(t.dueAt).getTime();
          return due >= monthStart && due <= monthEnd;
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calendar");
      setEvents([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [gridId, timeMin, timeMax]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const calendarItems: CalendarItem[] = [
    ...events.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      startAt: new Date(e.startAt),
      endAt: new Date(e.endAt),
      isAllDay: e.isAllDay,
      color: e.color || EVENT_COLORS[0],
      description: e.description,
      event: e,
    })),
    ...tasks.map((t) => {
      const d = new Date(t.dueAt!);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      return {
        type: "task" as const,
        id: `task-${t.id}`,
        title: t.title,
        startAt: start,
        endAt: end,
        isAllDay: true as const,
        color: TASK_PRIORITY_COLOR[t.priority] || "#6b7280",
        taskId: t.id,
        priority: t.priority,
      };
    }),
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const getItemsForDay = (day: number) =>
    calendarItems.filter((item) => itemTouchesDay(item, year, month, day));

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  if (!gridId) {
    return (
      <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
        <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white">Calendar</h3>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" aria-label="Close">×</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-sm">Calendar is available on a grid.</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📅</span> Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
          >
            + Event
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" aria-label="Close">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {toast && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
            {toast}
          </div>
        )}
        {error && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Previous month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h4>
          <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Next month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center font-medium text-gray-500 dark:text-gray-400 py-1">
              {d}
            </div>
          ))}
          {days.map((day, idx) => {
            const items = day !== null ? getItemsForDay(day) : [];
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={idx}
                className={`min-h-[4rem] rounded-lg border border-transparent p-1 flex flex-col ${
                  day === null ? "invisible" : isToday ? "bg-primary-500/15 dark:bg-primary-500/20 border-primary-500/30" : "hover:bg-gray-100/80 dark:hover:bg-gray-800/50"
                }`}
              >
                {day !== null && (
                  <span className={`text-xs font-medium ${isToday ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {day}
                  </span>
                )}
                {day !== null && (
                  <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden">
                    {items.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                        className="text-left truncate rounded px-1 py-0.5 text-[10px] font-medium border-l-2 hover:opacity-90"
                        style={{ borderLeftColor: item.color, backgroundColor: `${item.color}20` }}
                        title={item.title}
                      >
                        {item.type === "task" && "✓ "}
                        {item.title}
                      </button>
                    ))}
                    {items.length > 3 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1">+{items.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {loading && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading…</p>
        )}
      </div>

      {showAddModal && (
        <AddEventModal
          gridId={gridId}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchData(); setToast("Event added"); }}
          initialStart={new Date(year, month, 1)}
          initialEnd={new Date(year, month, 1)}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); fetchData(); setToast("Event updated"); }}
          onDeleted={() => { setEditingEvent(null); fetchData(); setToast("Event deleted"); }}
        />
      )}

      {detailItem && gridId && (
        <DetailModal
          item={detailItem}
          gridId={gridId}
          onClose={() => setDetailItem(null)}
          onEdit={() => {
            if (detailItem.type === "event") {
              setDetailItem(null);
              setEditingEvent(detailItem.event);
            }
          }}
          onTaskCreated={() => {
            setDetailItem(null);
            fetchData();
            setToast("Task created from event");
          }}
        />
      )}
    </div>
  );
}

function AddEventModal({
  gridId,
  onClose,
  onSaved,
  initialStart,
  initialEnd,
}: {
  gridId: string;
  onClose: () => void;
  onSaved: () => void;
  initialStart: Date;
  initialEnd: Date;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(initialStart.toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(initialEnd.toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(true);
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const start = isAllDay
        ? new Date(startDate + "T00:00:00.000Z")
        : new Date(startDate + "T" + startTime + ":00.000Z");
      const end = isAllDay
        ? new Date(endDate + "T23:59:59.999Z")
        : new Date(endDate + "T" + endTime + ":00.000Z");
      if (end < start) {
        setSaving(false);
        return;
      }
      const res = await fetch("/api/grid/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gridId,
          title: title.trim(),
          description: description.trim() || undefined,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          isAllDay,
          color,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white">New event</h4>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone, deadline, meeting…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">All day</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform"
                  style={{ backgroundColor: c, borderColor: color === c ? "#111" : "transparent", transform: color === c ? "scale(1.1)" : "scale(1)" }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "Adding…" : "Add event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEventModal({
  event,
  onClose,
  onSaved,
  onDeleted,
}: {
  event: GridCalendarEvent;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [startDate, setStartDate] = useState(event.startAt.slice(0, 10));
  const [startTime, setStartTime] = useState(event.startAt.slice(11, 16));
  const [endDate, setEndDate] = useState(event.endAt.slice(0, 10));
  const [endTime, setEndTime] = useState(event.endAt.slice(11, 16));
  const [isAllDay, setIsAllDay] = useState(event.isAllDay);
  const [color, setColor] = useState(event.color || EVENT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const start = isAllDay ? new Date(startDate + "T00:00:00.000Z") : new Date(startDate + "T" + startTime + ":00.000Z");
      const end = isAllDay ? new Date(endDate + "T23:59:59.999Z") : new Date(endDate + "T" + endTime + ":00.000Z");
      const res = await fetch(`/api/grid/calendar/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          isAllDay,
          color,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onSaved();
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/grid/calendar/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white">Edit event</h4>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">All day</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              {!isAllDay && <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              {!isAllDay && <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8 rounded-full border-2 transition-transform" style={{ backgroundColor: c, borderColor: color === c ? "#111" : "transparent", transform: color === c ? "scale(1.1)" : "scale(1)" }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleDelete} disabled={deleting} className="py-2 px-3 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailModal({
  item,
  gridId,
  onClose,
  onEdit,
  onTaskCreated,
}: {
  item: CalendarItem;
  gridId: string;
  onClose: () => void;
  onEdit: () => void;
  onTaskCreated: () => void;
}) {
  const [creatingTask, setCreatingTask] = useState(false);

  const handleCreateTask = async () => {
    if (item.type !== "event") return;
    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gridId,
          title: item.title,
          description: item.description ?? undefined,
          dueAt: item.startAt.toISOString(),
          visibility: "SHARED",
          calendarEventId: item.event.id,
        }),
      });
      if (res.ok) onTaskCreated();
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="w-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: item.color }} />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {item.startAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              {!item.isAllDay && ` · ${item.startAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${item.endAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
            </p>
            {item.type === "event" && item.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.description}</p>}
            {item.type === "task" && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From Projects & Tasks</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 min-w-[80px] py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium">
            Close
          </button>
          {item.type === "event" && (
            <>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={creatingTask}
                className="flex-1 min-w-[80px] py-2 rounded-lg border border-primary-500 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-500/10 disabled:opacity-50"
              >
                {creatingTask ? "Creating…" : "Create task"}
              </button>
              <button type="button" onClick={onEdit} className="flex-1 min-w-[80px] py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
