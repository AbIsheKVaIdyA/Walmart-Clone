import crypto from 'crypto';
import { encryptData, decryptData, generateSecureToken } from './security';

// Mock payment gateway configuration
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'https://api.mock-payment-gateway.com';
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || 'mock-api-key';
const PAYMENT_SECRET = process.env.PAYMENT_SECRET || 'mock-secret';

// Payment card interface
export interface PaymentCard {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  holderName: string;
}

// Tokenized card data
export interface TokenizedCard {
  token: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
}

// Payment result
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  tokenizedCard?: TokenizedCard;
}

// Encrypt sensitive payment data
export const encryptPaymentData = (card: PaymentCard): string => {
  const cardData = {
    number: card.number,
    cvv: card.cvv,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    holderName: card.holderName
  };
  
  return encryptData(JSON.stringify(cardData));
};

// Decrypt payment data (only for authorized operations)
export const decryptPaymentData = (encryptedData: string): PaymentCard => {
  const decryptedData = decryptData(encryptedData);
  return JSON.parse(decryptedData);
};

// Tokenize card data (simulate payment gateway tokenization)
export const tokenizeCard = async (card: PaymentCard): Promise<TokenizedCard> => {
  // In a real implementation, this would call the payment gateway API
  // For simulation, we'll create a mock token
  
  const token = generateSecureToken(32);
  const last4 = card.number.slice(-4);
  const brand = detectCardBrand(card.number);
  
  // Store tokenized data (in production, this would be stored securely in the payment gateway)
  const tokenizedCard: TokenizedCard = {
    token,
    last4,
    brand,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    holderName: card.holderName
  };
  
  return tokenizedCard;
};

// Detect card brand based on number
const detectCardBrand = (cardNumber: string): string => {
  const number = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  
  return 'unknown';
};

// Process payment using tokenized card
export const processPayment = async (
  tokenizedCard: TokenizedCard,
  amount: number,
  currency: string = 'USD',
  description?: string
): Promise<PaymentResult> => {
  try {
    // Simulate payment gateway API call
    const paymentData = {
      token: tokenizedCard.token,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description: description || 'Walmart Clone Purchase'
    };
    
    // Mock API call to payment gateway
    const response = await mockPaymentGatewayCall(paymentData);
    
    if (response.success) {
      return {
        success: true,
        transactionId: response.transactionId,
        tokenizedCard
      };
    } else {
      return {
        success: false,
        error: response.error || 'Payment failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Payment processing failed'
    };
  }
};

// Mock payment gateway API call
const mockPaymentGatewayCall = async (paymentData: any): Promise<any> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random success/failure for demo
  const success = Math.random() > 0.1; // 90% success rate
  
  if (success) {
    return {
      success: true,
      transactionId: `txn_${generateSecureToken(16)}`,
      status: 'completed'
    };
  } else {
    return {
      success: false,
      error: 'Insufficient funds'
    };
  }
};

// Validate card number using Luhn algorithm
export const validateCardNumber = (cardNumber: string): boolean => {
  const number = cardNumber.replace(/\D/g, '');
  
  if (number.length < 13 || number.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
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

// Validate CVV
export const validateCVV = (cvv: string, cardNumber: string): boolean => {
  const number = cardNumber.replace(/\D/g, '');
  const cvvDigits = cvv.replace(/\D/g, '');
  
  // American Express cards have 4-digit CVV
  if (/^3[47]/.test(number)) {
    return cvvDigits.length === 4;
  }
  
  // Other cards have 3-digit CVV
  return cvvDigits.length === 3;
};

// Validate expiry date
export const validateExpiryDate = (month: string, year: string): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const expiryYear = parseInt(year);
  const expiryMonth = parseInt(month);
  
  if (expiryYear < currentYear) {
    return false;
  }
  
  if (expiryYear === currentYear && expiryMonth < currentMonth) {
    return false;
  }
  
  return expiryMonth >= 1 && expiryMonth <= 12;
};

// Mask card number for display
export const maskCardNumber = (cardNumber: string): string => {
  const number = cardNumber.replace(/\D/g, '');
  if (number.length < 4) return number;
  
  const last4 = number.slice(-4);
  const masked = '*'.repeat(number.length - 4);
  
  return masked + last4;
};

// Create secure payment session
export const createPaymentSession = (): string => {
  return generateSecureToken(32);
};

// Validate payment session
export const validatePaymentSession = (sessionId: string): boolean => {
  // In production, this would validate against stored sessions
  return sessionId && sessionId.length === 64;
};

// Validation functions for API routes
export const validateAndSanitizeCardNumber = (cardNumber: string): { isValid: boolean; sanitized: string } => {
  const sanitized = cardNumber.replace(/\D/g, ''); // Remove non-digits
  const isValid = validateCardNumber(sanitized);
  return { isValid, sanitized };
};

export const validateAndSanitizeCVV = (cvv: string, cardNumber: string): { isValid: boolean; sanitized: string } => {
  const sanitized = cvv.replace(/\D/g, ''); // Remove non-digits
  const isValid = validateCVV(sanitized, cardNumber);
  return { isValid, sanitized };
};

export const validateAndSanitizeAmount = (amount: string): { isValid: boolean; sanitized: number } => {
  const sanitized = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const isValid = !isNaN(sanitized) && sanitized > 0 && sanitized <= 10000; // Max $10,000
  return { isValid, sanitized };
};
