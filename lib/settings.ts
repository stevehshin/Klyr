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

export function getNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true";
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? "true" : "false");
}
