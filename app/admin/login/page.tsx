"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { getCSRFToken } from "@/lib/security/csrfClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    getCSRFToken().then(setCsrfToken);
    
    if (isAuthenticated && user?.role === "admin") {
      router.push("/admin");
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = csrfToken || await getCSRFToken();
      if (!token) {
        setError("Security token not available. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      setAuth(data);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-100 py-12 px-4 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 w-full">
          <CardHeader className="text-center space-y-3 pb-6 pt-8">
            <div className="mx-auto w-20 h-20 bg-walmart rounded-full flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900">Admin Login</CardTitle>
            <CardDescription className="text-xl text-gray-600">
              Sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 sm:px-12 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                  className="h-12 text-base"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-walmart hover:bg-walmart/90 mt-8" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
