"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store";
import { useAuthStore } from "@/store/authStore";
import { getCartTotal } from "@/lib/getCartTotal";
import PaymentForm from "@/components/PaymentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCartIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { groupBySKU } from "@/lib/groupBySKU";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore((state) => state.cart);
  const { user, isAuthenticated } = useAuthStore();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState<string>("");
  // Store the total amount before cart is cleared
  const [finalAmount, setFinalAmount] = useState<string>("");

  const grouped = groupBySKU(cart);
  const basketTotal = getCartTotal(cart);
  const totalAmount = cart.reduce((acc, product) => acc + product.price, 0);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !paymentSuccess) {
      router.push("/basket");
    }
  }, [cart, router, paymentSuccess]);

  // Prevent modal from opening on checkout page
  useEffect(() => {
    // Ensure we're on the checkout page and not in a modal
    if (typeof window !== "undefined") {
      // Remove any modal overlays that might be present
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      overlays.forEach(overlay => {
        const element = overlay as HTMLElement;
        if (element.style.display !== 'none') {
          element.style.display = 'none';
        }
      });
    }
  }, []);

  const handlePaymentSuccess = (txnId: string, ordId: string) => {
    // Store the total amount before clearing cart
    const currentTotal = getCartTotal(useCartStore.getState().cart);
    setFinalAmount(currentTotal);
    
    setTransactionId(txnId);
    setOrderId(ordId);
    setPaymentSuccess(true);
    
    // Clear cart after successful payment (with delay to show confirmation)
    setTimeout(() => {
      const currentCart = useCartStore.getState().cart;
      currentCart.forEach((item) => {
        useCartStore.getState().removeFromCraft(item);
      });
    }, 5000); // Increased delay to 5 seconds
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (paymentSuccess) {
    return (
      <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-100 py-12 px-4 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="border-2 border-green-500 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                  <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                Payment Successful!
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Thank you for your purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Order ID:</span>
                  <span className="font-mono text-sm">{orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Transaction ID:</span>
                  <span className="font-mono text-sm">{transactionId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Amount:</span>
                  <span className="text-lg font-bold text-walmart">{finalAmount || basketTotal}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  A confirmation email has been sent to {user?.email || "your email"}
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push("/")}
                    className="flex-1 bg-walmart hover:bg-walmart/90"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={() => router.push("/basket")}
                    variant="outline"
                    className="flex-1"
                  >
                    View Orders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/basket")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cart
          </Button>
          <div className="flex items-center space-x-3">
            <ShoppingCartIcon className="w-8 h-8 text-walmart" />
            <h1 className="text-3xl sm:text-4xl font-bold">Checkout</h1>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Main Content - Full Width Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* Payment Form - Takes more space */}
          <div className="lg:col-span-7 xl:col-span-8">
            {error && (
              <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-6">
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError("")}
                    className="mt-2"
                  >
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            )}

            <PaymentForm
              amount={totalAmount}
              currency="USD"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card className="sticky top-4 shadow-md">
              <CardHeader className="bg-walmart/5">
                <CardTitle className="text-lg">Order Summary</CardTitle>
                <CardDescription>
                  {cart.length} {cart.length === 1 ? "item" : "items"} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {Object.keys(grouped).map((sku) => {
                    const item = grouped[sku][0];
                    const quantity = grouped[sku].length;
                    const itemTotal = grouped[sku].reduce((acc, p) => acc + p.price, 0);
                    return (
                      <div key={sku} className="flex gap-3 pb-3 border-b last:border-0">
                        {item.images[0] && (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            width={70}
                            height={70}
                            className="rounded-md object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Qty: {quantity}
                          </p>
                          <p className="text-sm font-bold mt-1 text-walmart">
                            ${itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="pt-4 border-t-2 mt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-walmart text-2xl">{basketTotal}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

