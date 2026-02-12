// Client-side encryption utilities using Web Crypto API
// This file should only be used in client components

const STORAGE_KEY = "klyr-encryption-key";

/**
 * Generate a new encryption key and store it in localStorage
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await window.crypto.subtle.exportKey("jwk", key);
  const keyString = JSON.stringify(exported);
  localStorage.setItem(STORAGE_KEY, keyString);
  return keyString;
}

/**
 * Get the encryption key from localStorage or URL hash
 */
export function getEncryptionKey(): string | null {
  // First check URL hash (#k=...)
  if (typeof window !== "undefined" && window.location.hash) {
    const match = window.location.hash.match(/#k=([^&]+)/);
    if (match) {
      const keyFromUrl = decodeURIComponent(match[1]);
      // Store it in localStorage for future use
      localStorage.setItem(STORAGE_KEY, keyFromUrl);
      return keyFromUrl;
    }
  }

  // Then check localStorage
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Import a key from JWK string
 */
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = JSON.parse(keyString);
  return await window.crypto.subtle.importKey(
    "jwk",
    keyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a message
 */
export async function encryptMessage(message: string): Promise<string> {
  const keyString = getEncryptionKey();
  if (!keyString) {
    throw new Error("No encryption key found");
  }

  const key = await importKey(keyString);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a message
 */
export async function decryptMessage(encryptedMessage: string): Promise<string> {
  const keyString = getEncryptionKey();
  if (!keyString) {
    throw new Error("No encryption key found");
  }

  const key = await importKey(keyString);

  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedMessage), (c) => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Get the current URL with encryption key in hash
 */
export function getShareableUrl(): string {
  const keyString = getEncryptionKey();
  if (!keyString) {
    return window.location.href.split("#")[0];
  }

  const baseUrl = window.location.href.split("#")[0];
  return `${baseUrl}#k=${encodeURIComponent(keyString)}`;
}
