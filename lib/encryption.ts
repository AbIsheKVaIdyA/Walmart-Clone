import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM encryption for authenticated encryption
 * 
 * IMPORTANT: 
 * - Never commit ENCRYPTION_KEY to version control
 * - Use different keys for development and production
 * - Rotate keys periodically
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM

/**
 * Get encryption key from environment variables
 * Throws error if key is not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Please set it in .env.local. Generate with: openssl rand -hex 32'
    );
  }

  // Key must be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 * 
 * @example
 * const encrypted = encrypt('4111111111111111');
 * // Returns: "a1b2c3d4...:e5f6g7h8...:i9j0k1l2..."
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encrypted
  // This allows us to decrypt without storing IV and authTag separately
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * 
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 * 
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 * 
 * @example
 * const decrypted = decrypt('a1b2c3d4...:e5f6g7h8...:i9j0k1l2...');
 * // Returns: "4111111111111111"
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty string');
  }

  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected format: iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed. Invalid key or corrupted data.');
  }
}

/**
 * Encrypt an object containing sensitive fields
 * Only encrypts specified fields, leaves others as-is
 * 
 * @param data - Object to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with specified fields encrypted
 * 
 * @example
 * const encrypted = encryptObject(
 *   { cardNumber: '4111111111111111', name: 'John Doe' },
 *   ['cardNumber']
 * );
 * // Returns: { cardNumber: 'encrypted...', name: 'John Doe' }
 */
export function encryptObject<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(String(encrypted[field])) as any;
    }
  }
  
  return encrypted;
}

/**
 * Decrypt an object containing encrypted fields
 * 
 * @param data - Object with encrypted fields
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @returns Object with specified fields decrypted
 * 
 * @example
 * const decrypted = decryptObject(
 *   { cardNumber: 'encrypted...', name: 'John Doe' },
 *   ['cardNumber']
 * );
 * // Returns: { cardNumber: '4111111111111111', name: 'John Doe' }
 */
export function decryptObject<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      try {
        decrypted[field] = decrypt(String(decrypted[field])) as any;
      } catch (error) {
        // If decryption fails, keep the encrypted value
        // This allows for graceful handling of corrupted data
        console.error(`Failed to decrypt field ${String(field)}:`, error);
      }
    }
  }
  
  return decrypted;
}

/**
 * Hash sensitive data (one-way, cannot be decrypted)
 * Use this for data that doesn't need to be retrieved in plain text
 * 
 * @param text - Text to hash
 * @returns SHA-256 hash
 */
export function hashSensitiveData(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

