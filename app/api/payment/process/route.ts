import { NextRequest, NextResponse } from 'next/server';
import { 
  authenticateToken, 
  addSecurityHeaders,
  logSecurityEvent,
  detectSuspiciousActivity
} from '@/lib/securityMiddleware';
import { 
  tokenizeCard, 
  processPayment, 
  validateCardNumber, 
  validateCVV, 
  validateExpiryDate,
  validateAndSanitizeAmount,
  validateAndSanitizeCardNumber,
  validateAndSanitizeCVV
} from '@/lib/payment';
import { validateInput, sanitizeObject } from '@/lib/validation';
import { logPaymentEvent } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    // Check for suspicious activity
    if (detectSuspiciousActivity(request)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', { url: request.url }, request);
      return NextResponse.json(
        { success: false, error: 'Request blocked for security reasons' },
        { status: 403 }
      );
    }

    // Authenticate user
    const auth = authenticateToken(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeObject(body, request);
    
    const { 
      cardNumber, 
      expiryMonth, 
      expiryYear, 
      cvv, 
      holderName, 
      amount, 
      currency = 'USD',
      description 
    } = sanitizedBody;

    // Validate required fields
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !holderName || !amount) {
      return NextResponse.json(
        { success: false, error: 'All payment fields are required' },
        { status: 400 }
      );
    }

    // Validate and sanitize card number
    const cardValidation = validateAndSanitizeCardNumber(cardNumber);
    if (!cardValidation.isValid) {
      logSecurityEvent('INVALID_CARD_NUMBER', { userId: auth.userId, error: cardValidation.error }, request);
      return NextResponse.json(
        { success: false, error: cardValidation.error },
        { status: 400 }
      );
    }

    // Validate CVV
    const cvvValidation = validateAndSanitizeCVV(cvv, cardValidation.sanitized);
    if (!cvvValidation.isValid) {
      logSecurityEvent('INVALID_CVV', { userId: auth.userId, error: cvvValidation.error }, request);
      return NextResponse.json(
        { success: false, error: cvvValidation.error },
        { status: 400 }
      );
    }

    // Validate expiry date
    if (!validateExpiryDate(expiryMonth, expiryYear)) {
      logSecurityEvent('INVALID_EXPIRY_DATE', { userId: auth.userId }, request);
      return NextResponse.json(
        { success: false, error: 'Card has expired or invalid expiry date' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountValidation = validateAndSanitizeAmount(amount);
    if (!amountValidation.isValid) {
      logSecurityEvent('INVALID_AMOUNT', { userId: auth.userId, error: amountValidation.error }, request);
      return NextResponse.json(
        { success: false, error: amountValidation.error },
        { status: 400 }
      );
    }

    // Validate holder name
    const nameValidation = validateInput(holderName, 'name', request);
    if (!nameValidation.isValid) {
      logSecurityEvent('INVALID_HOLDER_NAME', { userId: auth.userId, error: nameValidation.error }, request);
      return NextResponse.json(
        { success: false, error: nameValidation.error },
        { status: 400 }
      );
    }

    // Create payment card object
    const paymentCard = {
      number: cardValidation.sanitized,
      expiryMonth: expiryMonth.toString().padStart(2, '0'),
      expiryYear: expiryYear.toString(),
      cvv: cvvValidation.sanitized,
      holderName: nameValidation.sanitized
    };

    // Tokenize card
    const tokenizedCard = await tokenizeCard(paymentCard);

    // Process payment
    const paymentResult = await processPayment(
      tokenizedCard,
      amountValidation.sanitized,
      currency,
      description
    );

    if (paymentResult.success) {
      // Log successful payment
      logPaymentEvent(request, 'PAYMENT_SUCCESS', amountValidation.sanitized, paymentResult.transactionId, {
        userId: auth.userId,
        currency,
        cardLast4: tokenizedCard.last4,
        cardBrand: tokenizedCard.brand
      });

      const response = NextResponse.json({
        success: true,
        transactionId: paymentResult.transactionId,
        amount: amountValidation.sanitized,
        currency,
        cardLast4: tokenizedCard.last4,
        cardBrand: tokenizedCard.brand
      });

      return addSecurityHeaders(response);
    } else {
      // Log failed payment
      logPaymentEvent(request, 'PAYMENT_FAILED', amountValidation.sanitized, undefined, {
        userId: auth.userId,
        currency,
        error: paymentResult.error,
        cardLast4: tokenizedCard.last4
      });

      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Payment failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    logSecurityEvent('PAYMENT_ERROR', { error: error.message }, request);
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
