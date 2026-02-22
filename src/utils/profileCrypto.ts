import CryptoJS from "crypto-js";

/**
 * Encrypts JSON string with AES using the given password.
 * Returns base64 string (salt + iv + ciphertext are handled by crypto-js).
 */
export function encryptProfileJson(json: string, password: string): string {
  const encrypted = CryptoJS.AES.encrypt(json, password).toString();
  return encrypted;
}

/**
 * Decrypts a string encrypted with encryptProfileJson.
 * Returns the original JSON string or null if password is wrong or data invalid.
 */
export function decryptProfileJson(encrypted: string, password: string): string | null {
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
