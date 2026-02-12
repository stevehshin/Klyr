"use client";

import { useState, useEffect, useCallback } from "react";

export interface CalendarTileProps {
  tileId: string;
  onClose: () => void;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay?: boolean;
  htmlLink?: string;
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

function isSameDay(d: Date, year: number, month: number, day: number) {
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

export function CalendarTile({ tileId, onClose }: CalendarTileProps) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/status");
      const data = await res.json();
      if (res.ok) setConnected(!!data.connected);
      else setConnected(false);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (params?.get("calendar") === "connected") {
      setConnectMessage("Google Calendar connected!");
      checkStatus();
      if (typeof window !== "undefined") {
        const u = new URL(window.location.href);
        u.searchParams.delete("calendar");
        window.history.replaceState({}, "", u.toString());
      }
    }
  }, [checkStatus]);

  useEffect(() => {
    if (!connectMessage) return;
    const t = setTimeout(() => setConnectMessage(null), 4000);
    return () => clearTimeout(t);
  }, [connectMessage]);

  useEffect(() => {
    if (!connected) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const { timeMin, timeMax } = getMonthRange(year, month);
    setEventsLoading(true);
    setError(null);
    fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error && !data.events) {
          setError(data.error);
          setEvents([]);
        } else {
          setEvents(data.events ?? []);
        }
      })
      .catch(() => {
        setError("Failed to load events");
        setEvents([]);
      })
      .finally(() => setEventsLoading(false));
  }, [connected, currentDate.getFullYear(), currentDate.getMonth()]);

  const handleConnect = async () => {
    setError(null);
    try {
      const res = await fetch("/api/calendar/oauth/url");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get connect URL");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start connect");
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/calendar/disconnect", { method: "POST" });
      setConnected(false);
      setEvents([]);
      setConnectMessage(null);
    } catch {
      setError("Failed to disconnect");
    }
  };

  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = e.start.slice(0, 10);
      const [y, m, dNum] = d.split("-").map(Number);
      return y === year && m === currentDate.getMonth() + 1 && dNum === day;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
        <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white">Calendar</h3>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" aria-label="Close tile">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (connected === false) {
    return (
      <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
        <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white">Calendar</h3>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" aria-label="Close tile">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your Google Calendar to see events in this tile.
          </p>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
          <button
            onClick={handleConnect}
            className="w-full px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Connect Google Calendar
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            You’ll be asked to sign in with Google and allow read-only access to your calendar events.
          </p>
        </div>
      </div>
    );
  }

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📅</span> Calendar
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleDisconnect(); }}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
            title="Disconnect Google Calendar"
          >
            Disconnect
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            aria-label="Close tile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {connectMessage && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
            {connectMessage}
          </div>
        )}
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {month} {year}
          </h4>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayEvents = day !== null ? getEventsForDay(day) : [];
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={index}
                className={`min-h-[2rem] flex flex-col items-center justify-start p-0.5 text-sm rounded-lg ${
                  day === null
                    ? ""
                    : isToday
                    ? "bg-primary-600 text-white font-bold"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {day !== null && <span>{day}</span>}
                {day !== null && dayEvents.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          isToday ? "bg-white" : "bg-primary-500"
                        }`}
                        title={ev.summary}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className={`text-[10px] ${isToday ? "text-white" : "text-gray-500"}`}>+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {eventsLoading && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading events…</p>
        )}
        {connected && events.length > 0 && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">This month</p>
            <ul className="space-y-1.5">
              {events.slice(0, 10).map((ev) => (
                <li key={ev.id} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {ev.allDay ? "All day" : ev.start.slice(11, 16)} — {ev.summary}
                </li>
              ))}
              {events.length > 10 && <li className="text-xs text-gray-500">+{events.length - 10} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
