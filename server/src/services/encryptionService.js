const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from CREDENTIAL_ENCRYPTION_KEY
function getKey() {
  const secret = config.CREDENTIAL_ENCRYPTION_KEY || 'agentflow_default_32byte_secret_key!';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

const encryptionService = {
  encrypt: (plainText) => {
    if (!plainText) return null;
    try {
      const key = getKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(typeof plainText === 'object' ? JSON.stringify(plainText) : String(plainText), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      logger.error('Failed to encrypt credential', error);
      throw new Error('Encryption failed');
    }
  },

  decrypt: (cipherText) => {
    if (!cipherText) return null;
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid cipher format');
      }
      const [ivHex, authTagHex, encryptedHex] = parts;
      const key = getKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      logger.error('Failed to decrypt credential', error);
      throw new Error('Decryption failed or invalid key');
    }
  }
};

module.exports = encryptionService;
