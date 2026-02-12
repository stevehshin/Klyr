/**
 * Human-readable labels for tile types (for dock, menus, etc.)
 */

export function getTileLabel(type: string, fallback?: string): string {
  const labels: Record<string, string> = {
    notes: "Notes",
    tasks: "Tasks",
    links: "Links",
    calendar: "Calendar",
    dm: "DM",
    channel: "Channel",
    call: "Call",
    summary: "Summary",
  };
  return labels[type] ?? fallback ?? type;
}
