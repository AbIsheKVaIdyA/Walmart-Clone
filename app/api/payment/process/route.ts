/**
 * Payment Processing API Route
 * 
 * This route demonstrates secure handling of sensitive payment data:
 * 1. ✅ Input validation
 * 2. ✅ Parameterized database queries (via Supabase)
 * 3. ✅ Encryption of sensitive data before storage
 * 4. ✅ Never logging sensitive information
 * 
 * IMPORTANT: This is an example implementation. For production, you should:
 * - Use a PCI-compliant payment processor (Stripe, PayPal, etc.)
 * - Never store full credit card numbers (use tokenization)
 * - Implement proper error handling and logging
 * - Add rate limiting
 * - Add request authentication/authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

/**
 * Payment request interface
 * In production, you should validate this with a schema validator like Zod
 */
interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * POST /api/payment/process
 * Process a payment and store encrypted payment information
 */
export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const {
      userId,
      amount,
      currency = 'USD',
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      cvv,
      billingAddress,
    } = body;

    // ✅ Step 1: Input Validation
    if (!userId || !amount || !cardNumber || !cardHolderName || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0 || amount > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate card number format (basic validation)
    const cardNumberRegex = /^\d{13,19}$/;
    const cleanedCardNumber = cardNumber.replace(/\s+/g, '');
    if (!cardNumberRegex.test(cleanedCardNumber)) {
      return NextResponse.json(
        { error: 'Invalid card number format' },
        { status: 400 }
      );
    }

    // Validate CVV
    const cvvRegex = /^\d{3,4}$/;
    if (!cvvRegex.test(cvv)) {
      return NextResponse.json(
        { error: 'Invalid CVV format' },
        { status: 400 }
      );
    }

    // Validate expiry date
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return NextResponse.json(
        { error: 'Card has expired' },
        { status: 400 }
      );
    }

    // Validate userId format (UUID or guest ID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const guestIdRegex = /^guest_\d+_[a-z0-9]+$/i;
    if (!uuidRegex.test(userId) && !guestIdRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // ✅ Step 2: Encrypt Sensitive Data BEFORE storing
    // Never store plain text credit card numbers or CVV!
    const encryptedCardNumber = encrypt(cleanedCardNumber);
    const encryptedCvv = encrypt(cvv);

    // ✅ Step 3: Store Payment Method (if saving for future use)
    // In production, you might want to use tokenization instead
    let paymentMethodId: string | null = null;

    try {
      // ✅ SECURE: Supabase automatically parameterizes this query
      // All values are passed as parameters, preventing SQL injection
      const { data: paymentMethod, error: paymentMethodError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId, // ✅ Parameterized
          card_number_encrypted: encryptedCardNumber, // ✅ Encrypted + Parameterized
          card_holder_name: cardHolderName.trim(), // ✅ Parameterized
          expiry_month: expiryMonth, // ✅ Parameterized
          expiry_year: expiryYear, // ✅ Parameterized
          cvv_encrypted: encryptedCvv, // ✅ Encrypted + Parameterized
          billing_address: billingAddress ? JSON.stringify(billingAddress) : null, // ✅ Parameterized
        })
        .select('id')
        .single();

      if (paymentMethodError) {
        console.error('Error saving payment method:', paymentMethodError.message);
        // Don't fail the transaction if payment method save fails
        // In production, you might want to handle this differently
      } else {
        paymentMethodId = paymentMethod?.id || null;
      }
    } catch (error) {
      console.error('Error in payment method creation:', error);
      // Continue with transaction creation even if payment method save fails
    }

    // ✅ Step 4: Create Transaction Record
    // Store minimal encrypted data for audit purposes
    const transactionData = {
      cardLast4: cleanedCardNumber.slice(-4), // Safe to store last 4 digits
      cardHolderName: cardHolderName.trim(),
      expiryMonth,
      expiryYear,
    };
    const encryptedTransactionData = encrypt(JSON.stringify(transactionData));

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // ✅ SECURE: Parameterized query
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId, // ✅ Parameterized
        order_id: orderId, // ✅ Parameterized
        amount: amount, // ✅ Parameterized
        currency: currency, // ✅ Parameterized
        payment_method_id: paymentMethodId, // ✅ Parameterized
        status: 'pending', // Will be updated after payment processor confirmation
        encrypted_payment_data: encryptedTransactionData, // ✅ Encrypted + Parameterized
      })
      .select('id, order_id, amount, currency, status, created_at')
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError.message);
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    // ✅ Step 5: In production, here you would:
    // - Call payment processor API (Stripe, PayPal, etc.)
    // - Update transaction status based on response
    // - Handle webhooks for async payment confirmation
    // 
    // For now, we'll simulate a successful payment
    // In production, NEVER return success without actual payment confirmation!

    // Update transaction status to completed (in production, do this after payment processor confirms)
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transaction.id);

    // ✅ Step 6: Return Response
    // NEVER return sensitive data in response!
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      orderId: transaction.order_id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: 'completed',
      // ✅ DO NOT return:
      // - cardNumber
      // - cvv
      // - full encrypted data
      // - any sensitive information
    }, { status: 200 });

  } catch (error: any) {
    // ✅ Never log sensitive data in error messages
    console.error('Payment processing error:', error.message);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/process?transactionId=xxx
 * Retrieve transaction details (without sensitive data)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const userId = searchParams.get('userId');

    if (!transactionId || !userId) {
      return NextResponse.json(
        { error: 'Transaction ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // ✅ SECURE: Parameterized query with user verification
    // Only return transactions that belong to the requesting user
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('id, order_id, amount, currency, status, created_at')
      .eq('id', transactionId) // ✅ Parameterized
      .eq('user_id', userId) // ✅ Parameterized - ensures user can only access their own transactions
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // ✅ Return only non-sensitive data
    return NextResponse.json({
      transactionId: transaction.id,
      orderId: transaction.order_id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      createdAt: transaction.created_at,
      // ✅ DO NOT return encrypted_payment_data
    });

  } catch (error: any) {
    console.error('Error retrieving transaction:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

