/** LocalStorage key for user-provided OpenAI API key (Daily Summary). Stored in browser only. */
export const OPENAI_API_KEY_STORAGE_KEY = "klyr_openai_api_key";

export function getStoredOpenAIKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
}

export function setStoredOpenAIKey(value: string | null): void {
  if (typeof window === "undefined") return;
  if (value === null || value.trim() === "") {
    localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
  } else {
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, value.trim());
  }
}

const NOTIFICATIONS_ENABLED_KEY = "klyr_notifications_enabled";
const NOTIFICATION_PREFS_KEY = "klyr_notification_prefs";

export function getNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true";
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? "true" : "false");
}

export interface NotificationPrefs {
  dm: boolean;
  mentions: boolean;
  channelActivity: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dm: true,
  mentions: true,
  channelActivity: false,
};

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      dm: parsed.dm ?? DEFAULT_NOTIFICATION_PREFS.dm,
      mentions: parsed.mentions ?? DEFAULT_NOTIFICATION_PREFS.mentions,
      channelActivity: parsed.channelActivity ?? DEFAULT_NOTIFICATION_PREFS.channelActivity,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function setNotificationPrefs(prefs: Partial<NotificationPrefs>): void {
  if (typeof window === "undefined") return;
  const current = getNotificationPrefs();
  const next = { ...current, ...prefs };
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
}
