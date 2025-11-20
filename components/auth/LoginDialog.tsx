"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCSRFToken } from "@/lib/security/csrfClient";

interface LoginDialogProps {
  children: React.ReactNode;
}

export function LoginDialog({ children }: LoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  // Fetch CSRF token when dialog opens
  useEffect(() => {
    if (open) {
      getCSRFToken().then(setCsrfToken);
    }
  }, [open]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have CSRF token
      const token = csrfToken || await getCSRFToken();
      if (!token) {
        setError("Security token not available. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      console.log("🟡 CLIENT: Attempting login with:", { email: loginData.email });
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token, // ✅ Include CSRF token in header
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(loginData),
      });

      console.log("🟡 CLIENT: Response status:", response.status);
      console.log("🟡 CLIENT: Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Login failed (${response.status})`);
      }

      const data = await response.json();
      console.log("🟢 CLIENT: Login successful!");

      setAuth(data);
      setOpen(false);
      setLoginData({ email: "", password: "" });
      // No need to reload - Zustand persist will handle state, and Header will update via React
    } catch (err: any) {
      console.error("🔴 CLIENT: Login error:", err);
      // Better error message for "Failed to fetch"
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setError("Cannot connect to server. Make sure the dev server is running on port 3000.");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (signupData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Ensure we have CSRF token
      const token = csrfToken || await getCSRFToken();
      if (!token) {
        setError("Security token not available. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token, // ✅ Include CSRF token in header
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          email: signupData.email,
          name: signupData.name,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `Signup failed (${response.status})`;
        throw new Error(errorMessage);
      }

      setAuth(data);
      setOpen(false);
      setSignupData({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
      });
      // No need to reload - Zustand persist will handle state, and Header will update via React
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Walmart</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>

        {/* Button-style Tab Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={activeTab === "login" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={activeTab === "signup" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setActiveTab("signup");
              setError(null);
            }}
          >
            Sign Up
          </Button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
                {error.includes("already exists") && (
                  <p className="mt-2 text-xs text-red-500">
                    Try logging in instead, or use a different email address.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                value={signupData.name}
                onChange={(e) =>
                  setSignupData({ ...signupData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="At least 8 characters"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

