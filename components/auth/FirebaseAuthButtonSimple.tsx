"use client";

import { useState } from 'react';
import { FirebaseAuthService } from '@/lib/firebaseAuthClient';
import { useFirebaseAuthStore } from '@/store/firebaseAuthStore';
import { UserRole } from '@/typings/authTypings';

export default function FirebaseAuthButtonSimple() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setUser, setAuthenticated } = useFirebaseAuthStore();

  // Email/Password form state
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  // Phone form state
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
    verificationCode: ''
  });

  const [verificationId, setVerificationId] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await FirebaseAuthService.signInWithEmail(emailForm.email, emailForm.password);
      
      if (result.success && result.user) {
        // Update the store state
        useFirebaseAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Close the modal
        setIsOpen(false);
        
        // Reset form
        setEmailForm({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (emailForm.password !== emailForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await FirebaseAuthService.signUpWithEmail(
        emailForm.email, 
        emailForm.password, 
        emailForm.name, 
        UserRole.CUSTOMER
      );
      
      if (result.success && result.user) {
        // Update the store state
        useFirebaseAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Close the modal
        setIsOpen(false);
        
        // Reset form
        setEmailForm({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setError(result.error || 'Sign up failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try popup first
      const result = await FirebaseAuthService.signInWithGoogle();
      
      if (result.success && result.user) {
        // Update the store state
        useFirebaseAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Close the modal
        setIsOpen(false);
        
        // Reset form
        setEmailForm({ email: '', password: '', name: '', confirmPassword: '' });
        setPhoneForm({ phoneNumber: '', verificationCode: '' });
        setVerificationId(null);
      } else {
        // If popup fails due to COOP issues, try redirect
        if (result.error && (result.error.includes('popup') || result.error.includes('COOP'))) {
          try {
            await FirebaseAuthService.signInWithGoogleRedirect();
            // The page will redirect, so we don't need to handle the result here
          } catch (redirectError: any) {
            setError('Google sign-in failed. Please try again.');
          }
        } else {
          setError(result.error || 'Google sign-in failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await FirebaseAuthService.sendPhoneVerification(phoneForm.phoneNumber);
      
      if (result.success) {
        setVerificationId(result.verificationId || null);
        setError(null);
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sign In to Walmart</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 ${activeTab === 'email' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Email
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-2 ${activeTab === 'google' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Google
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={`px-4 py-2 ${activeTab === 'phone' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Phone
          </button>
        </div>
        
        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="text-center text-gray-500">or</div>
            
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={emailForm.name}
                  onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={emailForm.confirmPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}
        
        {/* Google Tab */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn} 
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign in with Google'}
            </button>
          </div>
        )}
        
        {/* Phone Tab */}
        {activeTab === 'phone' && (
          <div className="space-y-4">
            {!verificationId ? (
              <form onSubmit={handlePhoneVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneForm.phoneNumber}
                    onChange={(e) => setPhoneForm({ ...phoneForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Verification code sent to {phoneForm.phoneNumber}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={phoneForm.verificationCode}
                    onChange={(e) => setPhoneForm({ ...phoneForm, verificationCode: e.target.value })}
                    maxLength={6}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <button 
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm text-center mt-4">
            {error}
          </div>
        )}
        
        {/* reCAPTCHA container for phone auth */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
