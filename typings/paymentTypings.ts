/**
 * Payment-related TypeScript interfaces
 */

export interface PaymentMethod {
  id: string;
  userId: string;
  cardNumberEncrypted: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvvEncrypted: string;
  billingAddress?: BillingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Transaction {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  status: TransactionStatus;
  encryptedPaymentData?: string;
  createdAt: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  billingAddress?: BillingAddress;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
}



