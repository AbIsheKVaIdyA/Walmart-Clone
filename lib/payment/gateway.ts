/**
 * Mock Payment Gateway Service
 * 
 * This service simulates a payment gateway with tokenization.
 * In production, replace this with a real payment processor like Stripe, PayPal, etc.
 * 
 * Security Features:
 * - Tokenizes card data (never stores full card numbers)
 * - Validates card numbers using Luhn algorithm
 * - Simulates payment processing with realistic delays
 * - Returns secure tokens for payment processing
 */

export interface PaymentToken {
  token: string;
  last4: string;
  cardType: string;
  expiryMonth: number;
  expiryYear: number;
  tokenizedAt: string;
}

export interface PaymentGatewayResponse {
  success: boolean;
  transactionId: string;
  token?: PaymentToken;
  error?: string;
}

/**
 * Validate card number using Luhn algorithm
 */
function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

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
}

/**
 * Detect card type from card number
 */
function detectCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s+/g, '');
  
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  
  return 'Unknown';
}

/**
 * Tokenize card data - generates a secure token
 * In production, this would be done by the payment processor
 */
function tokenizeCard(cardNumber: string, expiryMonth: number, expiryYear: number): PaymentToken {
  const cleaned = cardNumber.replace(/\s+/g, '');
  const last4 = cleaned.slice(-4);
  const cardType = detectCardType(cleaned);
  
  // Generate a secure token (in production, this would come from payment processor)
  const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  
  return {
    token,
    last4,
    cardType,
    expiryMonth,
    expiryYear,
    tokenizedAt: new Date().toISOString(),
  };
}

/**
 * Simulate payment processing with the gateway
 * In production, this would make an actual API call to Stripe, PayPal, etc.
 */
export async function processPayment(
  cardNumber: string,
  cardHolderName: string,
  expiryMonth: number,
  expiryYear: number,
  cvv: string,
  amount: number,
  currency: string = 'USD'
): Promise<PaymentGatewayResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Validate card number
  if (!validateCardNumber(cardNumber)) {
    return {
      success: false,
      transactionId: '',
      error: 'Invalid card number. Please check and try again.',
    };
  }

  // Validate expiry date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    return {
      success: false,
      transactionId: '',
      error: 'Card has expired. Please use a valid card.',
    };
  }

  // Validate CVV
  if (!/^\d{3,4}$/.test(cvv)) {
    return {
      success: false,
      transactionId: '',
      error: 'Invalid CVV. Please check and try again.',
    };
  }

  // Simulate random failures (5% failure rate for demo)
  if (Math.random() < 0.05) {
    return {
      success: false,
      transactionId: '',
      error: 'Payment processing failed. Please try again or use a different payment method.',
    };
  }

  // Tokenize the card data
  const token = tokenizeCard(cardNumber, expiryMonth, expiryYear);

  // Generate transaction ID
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    transactionId,
    token,
  };
}

/**
 * Validate payment details before processing
 */
export function validatePaymentDetails(
  cardNumber: string,
  cardHolderName: string,
  expiryMonth: number,
  expiryYear: number,
  cvv: string
): { valid: boolean; error?: string } {
  if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear || !cvv) {
    return { valid: false, error: 'All fields are required' };
  }

  if (cardHolderName.trim().length < 2) {
    return { valid: false, error: 'Card holder name must be at least 2 characters' };
  }

  if (!validateCardNumber(cardNumber)) {
    return { valid: false, error: 'Invalid card number format' };
  }

  if (expiryMonth < 1 || expiryMonth > 12) {
    return { valid: false, error: 'Invalid expiry month' };
  }

  const currentYear = new Date().getFullYear();
  if (expiryYear < currentYear || expiryYear > currentYear + 20) {
    return { valid: false, error: 'Invalid expiry year' };
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return { valid: false, error: 'Invalid CVV format' };
  }

  return { valid: true };
}

