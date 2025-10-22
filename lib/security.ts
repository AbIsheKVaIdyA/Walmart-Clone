import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@/typings/authTypings';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Enhanced password hashing with Argon2
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    });
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await argon2.verify(hashedPassword, password);
  } catch (error) {
    return false;
  }
};

// Enhanced JWT token generation with shorter expiration
export const generateAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    { 
      userId, 
      role,
      type: 'access'
    }, 
    JWT_SECRET, 
    { 
      expiresIn: '15m', // Short-lived access token
      issuer: 'walmart-clone',
      audience: 'walmart-clone-users'
    }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { 
      userId,
      type: 'refresh'
    }, 
    JWT_REFRESH_SECRET, 
    { 
      expiresIn: '7d', // Longer-lived refresh token
      issuer: 'walmart-clone',
      audience: 'walmart-clone-users'
    }
  );
};

export const verifyAccessToken = (token: string): { userId: string; role: UserRole } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'access') return null;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
};

// Data encryption for sensitive information
export const encryptData = (data: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptData = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify CSRF token
export const verifyCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken;
};

// User management functions
export const findUserByEmail = async (email: string): Promise<User | null> => {
  // This would typically query a database
  // For now, return null as we're using Firebase for user management
  return null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  // This would typically query a database
  // For now, return null as we're using Firebase for user management
  return null;
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  // This would typically create a user in a database
  // For now, return a mock user as we're using Firebase for user management
  const user: User = {
    id: crypto.randomUUID(),
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return user;
};

export const validateUserPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await verifyPassword(password, hashedPassword);
};

// Security logging functions
export const logSecurityEvent = (event: string, details: any): void => {
  console.log(`[SECURITY] ${event}:`, details);
};

export const detectSuspiciousActivity = (userId: string, activity: string): boolean => {
  // Simple suspicious activity detection
  const suspiciousPatterns = ['brute_force', 'multiple_failed_logins', 'unusual_location'];
  return suspiciousPatterns.some(pattern => activity.includes(pattern));
};

// Security headers
export const addSecurityHeaders = (response: Response): Response => {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
};
