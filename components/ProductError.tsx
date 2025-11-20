"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductErrorProps {
  errorType?: "rate_limit" | "not_found" | "server_error" | "unauthorized" | "unknown";
}

export function ProductError({ errorType = "unknown" }: ProductErrorProps) {
  const router = useRouter();
  
  const handleRetry = () => {
    router.refresh();
  };
  const getErrorMessage = () => {
    switch (errorType) {
      case "rate_limit":
        return {
          title: "Too Many Requests",
          message: "We're experiencing high traffic. Please try again in a few moments.",
          icon: <RefreshCw className="h-16 w-16 text-yellow-500" />,
        };
      case "not_found":
        return {
          title: "Product Not Found",
          message: "Sorry, we couldn't find the product you're looking for.",
          icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
        };
      case "server_error":
        return {
          title: "Server Error",
          message: "Something went wrong on our end. Please try again later.",
          icon: <AlertCircle className="h-16 w-16 text-red-500" />,
        };
      case "unauthorized":
        return {
          title: "Service Unavailable",
          message: "The product service is currently unavailable due to configuration issues. Please contact support if this persists.",
          icon: <Lock className="h-16 w-16 text-orange-500" />,
        };
      default:
        return {
          title: "Unable to Load Product",
          message: "We encountered an issue loading this product. Please try again.",
          icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
        };
    }
  };

  const error = getErrorMessage();

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl border-0 p-8 sm:p-12 text-center space-y-6">
          <div className="flex justify-center">{error.icon}</div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-gray-900">{error.title}</h1>
            <p className="text-gray-600 text-xl">{error.message}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleRetry}
              className="bg-walmart hover:bg-walmart/90 text-white h-12 text-base font-semibold"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-base font-semibold">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Button>
            </Link>
          </div>

          {errorType === "rate_limit" && (
            <div className="mt-8 p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-base text-yellow-800">
                <strong>Tip:</strong> Wait a few seconds before trying again, or browse other products in the meantime.
              </p>
            </div>
          )}

          {errorType === "unauthorized" && (
            <div className="mt-8 p-5 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-base text-orange-800">
                <strong>Note:</strong> This is a configuration issue. Please check that OXYLABS_USERNAME and OXYLABS_PASSWORD environment variables are set correctly in your .env.local file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

