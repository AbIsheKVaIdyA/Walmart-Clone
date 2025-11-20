"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { validatePaymentDetails } from "@/lib/payment/gateway";
import { useAuthStore } from "@/store/authStore";
import { Loader2, CreditCard, Lock, Shield } from "lucide-react";

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (transactionId: string, orderId: string) => void;
  onError: (error: string) => void;
}

interface FormData {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function PaymentForm({ amount, currency = "USD", onSuccess, onError }: PaymentFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    cardNumber: "",
    cardHolderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "US",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Handle input changes
  const handleChange = (field: keyof FormData, value: string) => {
    if (field === "cardNumber") {
      value = formatCardNumber(value);
    }
    if (field === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    if (field === "expiryMonth" || field === "expiryYear") {
      value = value.replace(/\D/g, "");
    }
    if (field === "expiryYear" && value.length <= 2) {
      // Auto-format 2-digit year to 4-digit
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const year = parseInt(value);
      if (year >= 0 && year <= 99) {
        value = (currentCentury + year).toString();
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate card number
    if (!formData.cardNumber || formData.cardNumber.replace(/\s+/g, "").length < 13) {
      newErrors.cardNumber = "Please enter a valid card number";
    }

    // Validate card holder name
    if (!formData.cardHolderName || formData.cardHolderName.trim().length < 2) {
      newErrors.cardHolderName = "Please enter card holder name";
    }

    // Validate expiry month
    const month = parseInt(formData.expiryMonth);
    if (!formData.expiryMonth || month < 1 || month > 12) {
      newErrors.expiryMonth = "Invalid month";
    }

    // Validate expiry year
    const year = parseInt(formData.expiryYear);
    const currentYear = new Date().getFullYear();
    if (!formData.expiryYear || year < currentYear || year > currentYear + 20) {
      newErrors.expiryYear = "Invalid year";
    }

    // Validate CVV
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = "Please enter CVV";
    }

    // Validate billing address
    if (!formData.billingStreet.trim()) {
      newErrors.billingStreet = "Street address is required";
    }
    if (!formData.billingCity.trim()) {
      newErrors.billingCity = "City is required";
    }
    if (!formData.billingState.trim()) {
      newErrors.billingState = "State is required";
    }
    if (!formData.billingZip.trim()) {
      newErrors.billingZip = "ZIP code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get user ID from auth store
      // For demo purposes, use a generated UUID if not authenticated
      let userId: string;
      
      if (user?.id) {
        userId = user.id;
      } else {
        // Generate a temporary user ID for guest checkout
        // In production, you might want to require authentication
        userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const paymentData = {
        userId,
        amount,
        currency,
        cardNumber: formData.cardNumber.replace(/\s+/g, ""),
        cardHolderName: formData.cardHolderName.trim(),
        expiryMonth: parseInt(formData.expiryMonth),
        expiryYear: parseInt(formData.expiryYear),
        cvv: formData.cvv,
        billingAddress: {
          street: formData.billingStreet.trim(),
          city: formData.billingCity.trim(),
          state: formData.billingState.trim(),
          zipCode: formData.billingZip.trim(),
          country: formData.billingCountry,
        },
      };

      // Call payment API
      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Payment processing failed");
      }

      onSuccess(data.transactionId, data.orderId);
    } catch (error: any) {
      console.error("Payment error:", error);
      onError(error.message || "An error occurred while processing your payment");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate month options
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear + i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Information */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-walmart/10 to-blue-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-6 h-6" />
            Payment Information
          </CardTitle>
          <CardDescription className="text-base">
            Your payment information is encrypted and secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleChange("cardNumber", e.target.value)}
              maxLength={19}
              className={errors.cardNumber ? "border-red-500" : ""}
              disabled={isProcessing}
            />
            {errors.cardNumber && (
              <p className="text-sm text-red-500">{errors.cardNumber}</p>
            )}
          </div>

          {/* Card Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardHolderName">Card Holder Name</Label>
            <Input
              id="cardHolderName"
              type="text"
              placeholder="John Doe"
              value={formData.cardHolderName}
              onChange={(e) => handleChange("cardHolderName", e.target.value)}
              className={errors.cardHolderName ? "border-red-500" : ""}
              disabled={isProcessing}
            />
            {errors.cardHolderName && (
              <p className="text-sm text-red-500">{errors.cardHolderName}</p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <select
                id="expiryMonth"
                value={formData.expiryMonth}
                onChange={(e) => handleChange("expiryMonth", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessing}
              >
                <option value="">MM</option>
                {months.map((month) => (
                  <option key={month} value={month.toString().padStart(2, "0")}>
                    {month.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              {errors.expiryMonth && (
                <p className="text-sm text-red-500">{errors.expiryMonth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                type="text"
                placeholder="YYYY"
                value={formData.expiryYear}
                onChange={(e) => handleChange("expiryYear", e.target.value)}
                maxLength={4}
                className={errors.expiryYear ? "border-red-500" : ""}
                disabled={isProcessing}
              />
              {errors.expiryYear && (
                <p className="text-sm text-red-500">{errors.expiryYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleChange("cvv", e.target.value)}
                maxLength={4}
                className={errors.cvv ? "border-red-500" : ""}
                disabled={isProcessing}
              />
              {errors.cvv && (
                <p className="text-sm text-red-500">{errors.cvv}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-walmart/10 to-blue-500/10 rounded-t-lg">
          <CardTitle className="text-xl">Billing Address</CardTitle>
          <CardDescription className="text-base">Where should we send your receipt?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billingStreet">Street Address</Label>
            <Input
              id="billingStreet"
              type="text"
              placeholder="123 Main St"
              value={formData.billingStreet}
              onChange={(e) => handleChange("billingStreet", e.target.value)}
              className={errors.billingStreet ? "border-red-500" : ""}
              disabled={isProcessing}
            />
            {errors.billingStreet && (
              <p className="text-sm text-red-500">{errors.billingStreet}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingCity">City</Label>
              <Input
                id="billingCity"
                type="text"
                placeholder="New York"
                value={formData.billingCity}
                onChange={(e) => handleChange("billingCity", e.target.value)}
                className={errors.billingCity ? "border-red-500" : ""}
                disabled={isProcessing}
              />
              {errors.billingCity && (
                <p className="text-sm text-red-500">{errors.billingCity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingState">State</Label>
              <Input
                id="billingState"
                type="text"
                placeholder="NY"
                value={formData.billingState}
                onChange={(e) => handleChange("billingState", e.target.value)}
                className={errors.billingState ? "border-red-500" : ""}
                disabled={isProcessing}
              />
              {errors.billingState && (
                <p className="text-sm text-red-500">{errors.billingState}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingZip">ZIP Code</Label>
              <Input
                id="billingZip"
                type="text"
                placeholder="10001"
                value={formData.billingZip}
                onChange={(e) => handleChange("billingZip", e.target.value)}
                className={errors.billingZip ? "border-red-500" : ""}
                disabled={isProcessing}
              />
              {errors.billingZip && (
                <p className="text-sm text-red-500">{errors.billingZip}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCountry">Country</Label>
              <select
                id="billingCountry"
                value={formData.billingCountry}
                onChange={(e) => handleChange("billingCountry", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessing}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Secure Payment
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Your payment information is encrypted and tokenized. We never store your full card number.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-walmart hover:bg-walmart/90 text-white text-lg font-semibold"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Complete Payment
          </>
        )}
      </Button>
    </form>
  );
}

