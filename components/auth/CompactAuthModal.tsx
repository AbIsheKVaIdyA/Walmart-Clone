"use client";

import { useState } from 'react';
import { FirebaseAuthService } from '@/lib/firebaseAuthClient';
import { useFirebaseAuthStore } from '@/store/firebaseAuthStore';
import { UserRole } from '@/typings/authTypings';

export default function CompactAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { loginWithEmail, signupWithEmail, loginWithGoogle, isLoading, error, clearError } = useFirebaseAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    try {
      let result;
      
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setLocalError('Passwords do not match');
          return;
        }
        
        result = await signupWithEmail(
          formData.email, 
          formData.password, 
          formData.name, 
          UserRole.CUSTOMER
        );
      } else {
        result = await loginWithEmail(formData.email, formData.password);
      }
      
      if (result.success) {
        // Close the modal
        setIsOpen(false);
        setIsSignUp(false);
        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setLocalError(result.error || `${isSignUp ? 'Sign up' : 'Sign in'} failed`);
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setLocalError(null);

    try {
      const result = await loginWithGoogle();
      if (result.success) {
        setIsOpen(false);
        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setLocalError(result.error || 'Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      setLocalError('Google sign-in failed. Please try again.');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button 
            onClick={() => {
              setIsOpen(false);
              setIsSignUp(false);
              setFormData({ email: '', password: '', name: '', confirmPassword: '' });
              setLocalError(null);
            }}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Google Sign In */}
          <button 
            onClick={handleGoogleSignIn} 
            className="w-full bg-red-600 text-white py-2 px-4 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing In...' : 'Continue with Google'}
          </button>
          
          <div className="text-center text-gray-500 text-sm">or</div>
          
          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isSignUp && (
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm"
                  required
                />
              </div>
            )}
            
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                required
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                required
              />
            </div>
            
            {isSignUp && (
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm"
                  required
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          
          {/* Toggle Sign In/Sign Up */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setLocalError(null);
                setFormData({ email: '', password: '', name: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
          
          {(error || localError) && (
            <div className="text-red-500 text-sm text-center">
              {error || localError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
