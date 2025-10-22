import xss from 'xss';
import { logSecurityEvent, SecurityEventType } from './logging';

// Input sanitization options
const xssOptions = {
  whiteList: {
    p: [],
    br: [],
    strong: [],
    em: [],
    u: [],
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    ul: [], ol: [], li: [],
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height']
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

// Sanitize HTML content
export const sanitizeHTML = (input: string): string => {
  if (typeof input !== 'string') return '';
  return xss(input, xssOptions);
};

// Sanitize plain text
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate and sanitize email
export const validateAndSanitizeEmail = (email: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email must be a string' };
  }
  
  const sanitized = email.toLowerCase().trim();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
    return { isValid: false, sanitized: '', error: 'Invalid email format' };
  }
  
  // Check length
  if (sanitized.length > 254) {
    return { isValid: false, sanitized: '', error: 'Email too long' };
  }
  
  return { isValid: true, sanitized };
};

// Validate and sanitize password
export const validateAndSanitizePassword = (password: string): { isValid: boolean; sanitized: string; errors: string[] } => {
  const errors: string[] = [];
  
  if (typeof password !== 'string') {
    return { isValid: false, sanitized: '', errors: ['Password must be a string'] };
  }
  
  const sanitized = password.trim();
  
  if (sanitized.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (sanitized.length > 128) {
    errors.push('Password too long');
  }
  
  if (!/[A-Z]/.test(sanitized)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(sanitized)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(sanitized)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(sanitized)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(sanitized.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};

// Validate and sanitize name
export const validateAndSanitizeName = (name: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (typeof name !== 'string') {
    return { isValid: false, sanitized: '', error: 'Name must be a string' };
  }
  
  const sanitized = sanitizeText(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized: '', error: 'Name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, sanitized: '', error: 'Name too long' };
  }
  
  // Check for only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Name contains invalid characters' };
  }
  
  return { isValid: true, sanitized };
};

// Validate and sanitize phone number
export const validateAndSanitizePhone = (phone: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (typeof phone !== 'string') {
    return { isValid: false, sanitized: '', error: 'Phone must be a string' };
  }
  
  const sanitized = phone.replace(/\D/g, ''); // Remove non-digits
  
  if (sanitized.length < 10) {
    return { isValid: false, sanitized: '', error: 'Phone number too short' };
  }
  
  if (sanitized.length > 15) {
    return { isValid: false, sanitized: '', error: 'Phone number too long' };
  }
  
  return { isValid: true, sanitized };
};

// Validate and sanitize address
export const validateAndSanitizeAddress = (address: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (typeof address !== 'string') {
    return { isValid: false, sanitized: '', error: 'Address must be a string' };
  }
  
  const sanitized = sanitizeText(address);
  
  if (sanitized.length < 5) {
    return { isValid: false, sanitized: '', error: 'Address too short' };
  }
  
  if (sanitized.length > 200) {
    return { isValid: false, sanitized: '', error: 'Address too long' };
  }
  
  return { isValid: true, sanitized };
};

// Validate and sanitize credit card number
export const validateAndSanitizeCardNumber = (cardNumber: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (typeof cardNumber !== 'string') {
    return { isValid: false, sanitized: '', error: 'Card number must be a string' };
  }
  
  const sanitized = cardNumber.replace(/\D/g, ''); // Remove non-digits
  
  if (sanitized.length < 13 || sanitized.length > 19) {
    return { isValid: false, sanitized: '', error: 'Invalid card number length' };
  }
  
  // Luhn algorithm validation
  if (!validateLuhn(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Invalid card number' };
  }
  
  return { isValid: true, sanitized };
};

// Luhn algorithm for card validation
const validateLuhn = (cardNumber: string): boolean => {
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Validate and sanitize CVV
export const validateAndSanitizeCVV = (cvv: string, cardNumber: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (typeof cvv !== 'string') {
    return { isValid: false, sanitized: '', error: 'CVV must be a string' };
  }
  
  const sanitized = cvv.replace(/\D/g, ''); // Remove non-digits
  
  if (sanitized.length < 3 || sanitized.length > 4) {
    return { isValid: false, sanitized: '', error: 'Invalid CVV length' };
  }
  
  // American Express cards have 4-digit CVV
  const cleanCardNumber = cardNumber.replace(/\D/g, '');
  if (/^3[47]/.test(cleanCardNumber) && sanitized.length !== 4) {
    return { isValid: false, sanitized: '', error: 'American Express cards require 4-digit CVV' };
  }
  
  // Other cards have 3-digit CVV
  if (!/^3[47]/.test(cleanCardNumber) && sanitized.length !== 3) {
    return { isValid: false, sanitized: '', error: 'CVV must be 3 digits' };
  }
  
  return { isValid: true, sanitized };
};

// Validate and sanitize amount
export const validateAndSanitizeAmount = (amount: string | number): { isValid: boolean; sanitized: number; error?: string } => {
  let numAmount: number;
  
  if (typeof amount === 'string') {
    numAmount = parseFloat(amount);
  } else if (typeof amount === 'number') {
    numAmount = amount;
  } else {
    return { isValid: false, sanitized: 0, error: 'Amount must be a number' };
  }
  
  if (isNaN(numAmount)) {
    return { isValid: false, sanitized: 0, error: 'Invalid amount' };
  }
  
  if (numAmount < 0) {
    return { isValid: false, sanitized: 0, error: 'Amount cannot be negative' };
  }
  
  if (numAmount > 1000000) {
    return { isValid: false, sanitized: 0, error: 'Amount too large' };
  }
  
  // Round to 2 decimal places
  const sanitized = Math.round(numAmount * 100) / 100;
  
  return { isValid: true, sanitized };
};

// Detect and log potential XSS attacks
export const detectXSSAttempt = (input: string, req: any): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /<style[^>]*>.*?<\/style>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];
  
  const hasXSS = xssPatterns.some(pattern => pattern.test(input));
  
  if (hasXSS) {
    logSecurityEvent(req, SecurityEventType.XSS_ATTEMPT, 'XSS attempt detected', {
      input: input.substring(0, 100), // Log first 100 chars
      patterns: xssPatterns.filter(pattern => pattern.test(input)).map(p => p.toString())
    }, 'HIGH', 8);
  }
  
  return hasXSS;
};

// Detect and log potential SQL injection attempts
export const detectSQLInjectionAttempt = (input: string, req: any): boolean => {
  const sqlPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+set/gi,
    /alter\s+table/gi,
    /create\s+table/gi,
    /exec\s*\(/gi,
    /execute\s*\(/gi,
    /sp_/gi,
    /xp_/gi,
    /';\s*drop/gi,
    /'\s*or\s*'1'='1/gi,
    /'\s*or\s*1=1/gi,
    /'\s*union\s*select/gi
  ];
  
  const hasSQLInjection = sqlPatterns.some(pattern => pattern.test(input));
  
  if (hasSQLInjection) {
    logSecurityEvent(req, SecurityEventType.SQL_INJECTION_ATTEMPT, 'SQL injection attempt detected', {
      input: input.substring(0, 100), // Log first 100 chars
      patterns: sqlPatterns.filter(pattern => pattern.test(input)).map(p => p.toString())
    }, 'CRITICAL', 10);
  }
  
  return hasSQLInjection;
};

// Comprehensive input validation
export const validateInput = (input: any, type: 'email' | 'password' | 'name' | 'phone' | 'address' | 'card' | 'cvv' | 'amount', req?: any): any => {
  if (typeof input !== 'string' && type !== 'amount') {
    return { isValid: false, sanitized: '', error: 'Invalid input type' };
  }
  
  // Check for XSS attempts
  if (req && typeof input === 'string' && detectXSSAttempt(input, req)) {
    return { isValid: false, sanitized: '', error: 'Invalid input detected' };
  }
  
  // Check for SQL injection attempts
  if (req && typeof input === 'string' && detectSQLInjectionAttempt(input, req)) {
    return { isValid: false, sanitized: '', error: 'Invalid input detected' };
  }
  
  switch (type) {
    case 'email':
      return validateAndSanitizeEmail(input);
    case 'password':
      return validateAndSanitizePassword(input);
    case 'name':
      return validateAndSanitizeName(input);
    case 'phone':
      return validateAndSanitizePhone(input);
    case 'address':
      return validateAndSanitizeAddress(input);
    case 'card':
      return validateAndSanitizeCardNumber(input);
    case 'cvv':
      return validateAndSanitizeCVV(input, '');
    case 'amount':
      return validateAndSanitizeAmount(input);
    default:
      return { isValid: false, sanitized: '', error: 'Unknown validation type' };
  }
};

// Sanitize object recursively
export const sanitizeObject = (obj: any, req?: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Check for attacks first
    if (req) {
      detectXSSAttempt(obj, req);
      detectSQLInjectionAttempt(obj, req);
    }
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, req));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key], req);
      }
    }
    return sanitized;
  }
  
  return obj;
};
