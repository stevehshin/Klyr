/**
 * Shared helpers for grid-scoped content (Flux panel, summary, etc.)
 */

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const sinceYesterday = () => new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

interface GridTile {
  id: string;
  type: string;
  channelId?: string | null;
  conversationId?: string | null;
}

async function getGridTiles(gridId: string): Promise<GridTile[]> {
  const res = await fetch(`/api/grid/${gridId}`);
  if (!res.ok) return [];
  const { grid } = await res.json();
  return grid?.tiles ?? [];
}

export async function gatherGridContent(
  gridId: string,
  sinceFn: () => string = since24h
): Promise<string> {
  const { decryptMessage } = await import("@/lib/crypto");
  const tiles = await getGridTiles(gridId);
  const parts: string[] = [];
  const since = sinceFn();

  for (const tile of tiles) {
    if (tile.type === "notes") {
      const raw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(`klyr-notes-${tile.id}`)
          : null;
      if (raw?.trim()) parts.push(`[Notes]\n${raw}`);
    } else if (tile.type === "tasks") {
      const raw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(`klyr-tasks-${tile.id}`)
          : null;
      if (raw) {
        try {
          const tasks = JSON.parse(raw) as {
            text: string;
            completed: boolean;
            dueDate?: string;
          }[];
          if (tasks?.length) {
            const list = tasks
              .map(
                (t) =>
                  `${t.completed ? "[x]" : "[ ]"} ${t.text}${t.dueDate ? ` (due ${t.dueDate})` : ""}`
              )
              .join("\n");
            parts.push(`[Tasks]\n${list}`);
          }
        } catch {
          // ignore
        }
      }
    } else if (tile.type === "links") {
      const raw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(`klyr-links-${tile.id}`)
          : null;
      if (raw) {
        try {
          const links = JSON.parse(raw) as { title: string; url: string }[];
          if (links?.length) {
            const list = links.map((l) => `${l.title}: ${l.url}`).join("\n");
            parts.push(`[Links]\n${list}`);
          }
        } catch {
          // ignore
        }
      }
    } else if (tile.type === "dm") {
      try {
        const msgRes = await fetch(
          `/api/messages?tileId=${encodeURIComponent(tile.id)}`
        );
        if (!msgRes.ok) continue;
        const { messages } = await msgRes.json();
        const recent = (messages ?? []).filter(
          (m: { createdAt?: string }) => (m.createdAt || "") >= since
        );
        if (recent.length === 0) continue;
        const decrypted = await Promise.all(
          recent.map(
            async (m: {
              encryptedContent: string;
              createdAt?: string;
              user?: { email?: string };
            }) => {
              try {
                const text = await decryptMessage(m.encryptedContent);
                const who = m.user?.email?.split("@")[0] ?? "Someone";
                return `${m.createdAt ?? ""} ${who}: ${text}`;
              } catch {
                return null;
              }
            }
          )
        );
        const lines = decrypted.filter(Boolean).join("\n");
        if (lines) parts.push(`[DM]\n${lines}`);
      } catch {
        // skip
      }
    } else if (tile.type === "channel" && tile.channelId) {
      try {
        const msgRes = await fetch(
          `/api/channels/${tile.channelId}/messages`
        );
        if (!msgRes.ok) continue;
        const { messages } = await msgRes.json();
        const recent = (messages ?? []).filter(
          (m: { createdAt?: string }) => (m.createdAt || "") >= since
        );
        if (recent.length === 0) continue;
        const decrypted = await Promise.all(
          recent.map(
            async (m: {
              encryptedContent: string;
              createdAt?: string;
              user?: { email?: string };
            }) => {
              try {
                const text = await decryptMessage(m.encryptedContent);
                const who = m.user?.email?.split("@")[0] ?? "Someone";
                return `${m.createdAt ?? ""} ${who}: ${text}`;
              } catch {
                return null;
              }
            }
          )
        );
        const lines = decrypted.filter(Boolean).join("\n");
        if (lines) parts.push(`[Channel]\n${lines}`);
      } catch {
        // skip
      }
    }
  }

  if (parts.length === 0)
    return "No recent content in this grid. Notes, tasks, and links are included in full.";
  return parts.join("\n\n---\n\n");
}

export interface OverdueTask {
  tileId: string;
  text: string;
  dueDate: string;
}

export async function getOverdueTasks(gridId: string): Promise<OverdueTask[]> {
  // Prefer API tasks for this grid if available (auth from cookie)
  if (typeof fetch !== "undefined") {
    try {
      const res = await fetch(
        `/api/tasks?gridId=${encodeURIComponent(gridId)}`
      );
      if (res.ok) {
        const data = await res.json();
        const tasks = (data.tasks ?? []) as {
          id: string;
          title: string;
          dueAt?: string | null;
          status: string;
        }[];
        const today = new Date().toISOString().slice(0, 10);
        return tasks
          .filter((t) => t.status !== "DONE" && t.dueAt && t.dueAt.slice(0, 10) < today)
          .map((t) => ({ tileId: t.id, text: t.title, dueDate: t.dueAt!.slice(0, 10) }));
      }
    } catch {
      // fallback to localStorage
    }
  }
  const tiles = await getGridTiles(gridId);
  const taskTiles = tiles.filter((t) => t.type === "tasks");
  const today = new Date().toISOString().slice(0, 10);
  const out: OverdueTask[] = [];

  for (const tile of taskTiles) {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(`klyr-tasks-${tile.id}`)
        : null;
    if (!raw) continue;
    try {
      const tasks = JSON.parse(raw) as {
        id: string;
        text: string;
        completed: boolean;
        dueDate?: string;
      }[];
      for (const t of tasks ?? []) {
        if (t.completed || !t.dueDate) continue;
        const due = t.dueDate.slice(0, 10);
        if (due < today) out.push({ tileId: tile.id, text: t.text, dueDate: t.dueDate });
      }
    } catch {
      // ignore
    }
  }
  return out;
}

export type TileSuggestion = { type: string; label: string; reason: string };

export async function suggestTilesForGrid(
  gridId: string
): Promise<TileSuggestion[]> {
  const tiles = await getGridTiles(gridId);
  const types = new Set(tiles.map((t) => t.type));
  const suggestions: TileSuggestion[] = [];

  if (!types.has("notes"))
    suggestions.push({
      type: "notes",
      label: "Notes",
      reason: "No Notes tile yet — good for quick capture.",
    });
  if (!types.has("dm"))
    suggestions.push({
      type: "dm",
      label: "Messages",
      reason: "Add a Messages tile to see DMs in this grid.",
    });
  if (types.has("tasks") && !types.has("calendar"))
    suggestions.push({
      type: "calendar",
      label: "Calendar",
      reason: "You have Tasks — a Calendar can help with due dates.",
    });
  if (!types.has("tasks"))
    suggestions.push({
      type: "tasks",
      label: "Tasks",
      reason: "No Tasks tile — keep track of to-dos here.",
    });
  if (!types.has("links"))
    suggestions.push({
      type: "links",
      label: "Links",
      reason: "No Links tile — save references in one place.",
    });
  if (!types.has("call"))
    suggestions.push({
      type: "call",
      label: "Call",
      reason: "Add a Call tile for quick meetings in this grid.",
    });

  return suggestions.slice(0, 4);
}

/** Assemble content for "What should I focus on today?" (overdue tasks, due soon, calendar, channel activity). */
export async function getFocusContent(gridId: string): Promise<string> {
  const parts: string[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  try {
    const tasksRes = await fetch(`/api/tasks?gridId=${encodeURIComponent(gridId)}`);
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      const tasks = (data.tasks ?? []) as { title: string; dueAt?: string | null; status: string }[];
      const overdue = tasks.filter((t) => t.status !== "DONE" && t.dueAt && t.dueAt.slice(0, 10) < today);
      const dueSoon = tasks.filter(
        (t) =>
          t.status !== "DONE" &&
          t.dueAt &&
          t.dueAt >= now.toISOString() &&
          new Date(t.dueAt) <= weekEnd
      );
      if (overdue.length > 0) {
        parts.push("[Overdue tasks]\n" + overdue.map((t) => `• ${t.title} (due ${t.dueAt!.slice(0, 10)})`).join("\n"));
      }
      if (dueSoon.length > 0) {
        parts.push("[Due soon (this week)]\n" + dueSoon.map((t) => `• ${t.title} (due ${t.dueAt!.slice(0, 10)})`).join("\n"));
      }
    }
  } catch {
    // skip
  }

  try {
    const timeMin = now.toISOString();
    const timeMax = weekEnd.toISOString();
    const calRes = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
    if (calRes.ok) {
      const calData = await calRes.json();
      const events = (calData.events ?? []) as { summary: string; start: string }[];
      if (events.length > 0) {
        parts.push("[Upcoming calendar events]\n" + events.slice(0, 15).map((e) => `• ${e.start.slice(0, 16)} ${e.summary}`).join("\n"));
      }
    }
  } catch {
    // skip
  }

  const gridContent = await gatherGridContent(gridId, since24h);
  if (gridContent && !gridContent.includes("No recent content")) {
    parts.push("[Recent grid activity]\n" + gridContent);
  }

  if (parts.length === 0) return "No overdue tasks, no upcoming calendar events, and no recent grid activity in the last 24 hours.";
  return parts.join("\n\n---\n\n");
}

export { since24h, sinceYesterday };
