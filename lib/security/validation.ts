/**
 * Input Validation and Sanitization Utilities
 * Prevents XSS attacks and injection vulnerabilities.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Map of dangerous characters to their HTML entity equivalents
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  // Replace dangerous characters with HTML entities
  return input.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * Sanitizes an object recursively, sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'string' ? sanitizeInput(item) : item
      ) as any;
    }
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes email address
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
  sanitized: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
      sanitized: '',
    };
  }

  // Trim and normalize email
  const trimmed = email.trim().toLowerCase();
  
  // Basic email format validation (RFC 5322 compliant)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid email format',
      sanitized: sanitizeInput(trimmed),
    };
  }

  // Additional checks
  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: 'Email is too long (max 254 characters)',
      sanitized: sanitizeInput(trimmed),
    };
  }

  return {
    isValid: true,
    sanitized: trimmed, // Email doesn't need HTML escaping, but we normalize it
  };
}

/**
 * Validates and sanitizes a name field
 */
export function validateName(name: string): {
  isValid: boolean;
  error?: string;
  sanitized: string;
} {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Name is required',
      sanitized: '',
    };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters long',
      sanitized: sanitizeInput(trimmed),
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Name is too long (max 100 characters)',
      sanitized: sanitizeInput(trimmed),
    };
  }

  // Allow letters, spaces, hyphens, apostrophes (for names like O'Brien, Mary-Jane)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Name contains invalid characters',
      sanitized: sanitizeInput(trimmed),
    };
  }

  return {
    isValid: true,
    sanitized: sanitizeInput(trimmed),
  };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
  strength: 'weak' | 'medium' | 'strong';
} {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 'weak',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
      strength: 'weak',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password is too long (max 128 characters)',
      strength: 'weak',
    };
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, number, and special character',
      strength: 'weak',
    };
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (password.length >= 12 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
    strength = 'strong';
  } else if (password.length >= 8) {
    strength = 'medium';
  }

  return {
    isValid: true,
    strength,
  };
}

/**
 * Validates a string input with length constraints
 */
export function validateString(
  input: string,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    pattern?: RegExp;
    patternError?: string;
  } = {}
): {
  isValid: boolean;
  error?: string;
  sanitized: string;
} {
  const {
    minLength = 0,
    maxLength = 1000,
    required = false,
    pattern,
    patternError = 'Invalid format',
  } = options;

  if (!input || typeof input !== 'string') {
    if (required) {
      return {
        isValid: false,
        error: 'This field is required',
        sanitized: '',
      };
    }
    return {
      isValid: true,
      sanitized: '',
    };
  }

  const trimmed = input.trim();
  
  if (required && trimmed.length === 0) {
    return {
      isValid: false,
      error: 'This field is required',
      sanitized: '',
    };
  }

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `Must be at least ${minLength} characters long`,
      sanitized: sanitizeInput(trimmed),
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Must be no more than ${maxLength} characters long`,
      sanitized: sanitizeInput(trimmed),
    };
  }

  if (pattern && !pattern.test(trimmed)) {
    return {
      isValid: false,
      error: patternError,
      sanitized: sanitizeInput(trimmed),
    };
  }

  return {
    isValid: true,
    sanitized: sanitizeInput(trimmed),
  };
}

/**
 * Validates a number input
 */
export function validateNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
    integer?: boolean;
  } = {}
): {
  isValid: boolean;
  error?: string;
  value?: number;
} {
  const {
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    required = false,
    integer = false,
  } = options;

  if (input === null || input === undefined || input === '') {
    if (required) {
      return {
        isValid: false,
        error: 'This field is required',
      };
    }
    return {
      isValid: true,
    };
  }

  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Must be a valid number',
    };
  }

  if (integer && !Number.isInteger(num)) {
    return {
      isValid: false,
      error: 'Must be an integer',
    };
  }

  if (num < min) {
    return {
      isValid: false,
      error: `Must be at least ${min}`,
    };
  }

  if (num > max) {
    return {
      isValid: false,
      error: `Must be no more than ${max}`,
    };
  }

  return {
    isValid: true,
    value: num,
  };
}



