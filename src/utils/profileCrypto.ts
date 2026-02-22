import { getRandomValues } from "expo-crypto";

// Polyfill must run BEFORE crypto-js is loaded (it checks at init time)
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = {};
}
if (!globalThis.crypto.getRandomValues) {
  (globalThis.crypto as any).getRandomValues = getRandomValues;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CryptoJS = require("crypto-js") as typeof import("crypto-js");

export function encryptProfileJson(json: string, password: string): string {
  return CryptoJS.AES.encrypt(json, password).toString();
}

export function decryptProfileJson(
  encrypted: string,
  password: string,
): string | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, password);
    const str = decrypted.toString(CryptoJS.enc.Utf8);
    return str || null;
  } catch {
    return null;
  }
}

export function isEncryptedPayload(raw: string): boolean {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return o?.encrypted === true && typeof o?.cipher === "string";
  } catch {
    return false;
  }
}
