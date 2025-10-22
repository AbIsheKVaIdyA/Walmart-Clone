"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/typings/authTypings";
import { User, UserPlus, Shield } from "lucide-react";

export default function AuthButton() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    let result;
    if (isLoginMode) {
      result = await login(email, password);
    } else {
      // For signup, default to CUSTOMER role
      result = await signup(email, password, name, UserRole.CUSTOMER);
    }

    if (result.success) {
      setIsOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      setIsLoginMode(true);
    } else {
      setError(result.error || `${isLoginMode ? 'Login' : 'Signup'} failed`);
    }

    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
  };

  const isAdminEmail = email.toLowerCase().includes('admin') || email.toLowerCase().includes('walmart.com');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex text-white font-bold items-center space-x-2 text-sm">
          <User size={20} />
          <div>
            <p className="text-xs font-extralight">Account</p>
            <p>Sign In</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAdminEmail && isLoginMode && (
              <Shield className="h-5 w-5 text-blue-600" />
            )}
            {isLoginMode ? 'Sign In to Your Account' : 'Create New Account'}
          </DialogTitle>
        </DialogHeader>
        
        {isAdminEmail && isLoginMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">Admin Access Detected</p>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              You&apos;re signing in as an administrator. You&apos;ll have access to admin features.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-walmart focus:border-walmart"
                required
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-walmart focus:border-walmart"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-walmart focus:border-walmart"
              required
              minLength={isLoginMode ? 1 : 8}
            />
            {!isLoginMode && (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            )}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <Button
            type="submit"
            className="w-full bg-walmart hover:bg-walmart/90"
            disabled={isLoading}
          >
            {isLoading ? (isLoginMode ? "Signing In..." : "Creating Account...") : (isLoginMode ? "Sign In" : "Create Account")}
          </Button>
        </form>
        
        <div className="text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-walmart hover:text-walmart/80 font-medium"
          >
            {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-md">
          <p className="font-medium">Demo Credentials:</p>
          <p>Admin: admin@walmart.com / admin123</p>
          <p>Customer: customer@example.com / password123</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
