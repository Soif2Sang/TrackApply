import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn("⚠️ ENCRYPTION_KEY not set. OAuth credentials will not be encrypted!");
}

// Derive a 32-byte key from the provided key
function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required for encryption operations");
  }
  return crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
}

/**
 * Encrypts sensitive text data using AES-256-GCM
 * Returns the encrypted data as a base64 string with IV and auth tag
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    // Fallback: store as base64 (not secure, but prevents plaintext in DB)
    console.warn("⚠️ Storing credentials without encryption - ENCRYPTION_KEY not set");
    return Buffer.from(text).toString("base64");
  }

  try {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypts data that was encrypted with the encrypt function
 */
export function decrypt(encryptedData: string): string {
  if (!ENCRYPTION_KEY) {
    // Fallback: decode from base64
    return Buffer.from(encryptedData, "base64").toString("utf8");
  }

  try {
    const key = getKey();
    const parts = encryptedData.split(":");
    
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    throw new Error("Failed to decrypt sensitive data");
  }
}
