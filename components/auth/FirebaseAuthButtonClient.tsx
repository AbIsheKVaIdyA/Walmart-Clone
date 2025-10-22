"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FirebaseAuthService } from '@/lib/firebaseAuthClient';
import { useFirebaseAuthStore } from '@/store/firebaseAuthStore';
import { UserRole } from '@/typings/authTypings';
import { Mail, Lock, User, Phone, Chrome } from 'lucide-react';

export default function FirebaseAuthButtonClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { loginWithEmail, signupWithEmail, loginWithGoogle, isLoading, error, clearError } = useFirebaseAuthStore();

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
    clearError();
    setLocalError(null);

    try {
      const result = await loginWithEmail(emailForm.email, emailForm.password);
      
      if (result.success) {
        setIsOpen(false);
        setEmailForm({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setLocalError(result.error || 'Sign in failed');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (emailForm.password !== emailForm.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      const result = await signupWithEmail(
        emailForm.email, 
        emailForm.password, 
        emailForm.name, 
        UserRole.CUSTOMER
      );
      
      if (result.success) {
        setIsOpen(false);
        setEmailForm({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        setLocalError(result.error || 'Sign up failed');
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
      } else {
        setLocalError(result.error || 'Google sign in failed');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    }
  };

  const handlePhoneVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    try {
      const result = await FirebaseAuthService.sendPhoneVerification(phoneForm.phoneNumber);
      
      if (result.success) {
        setVerificationId(result.verificationId || null);
        setLocalError(null);
      } else {
        setLocalError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    } finally {
      // setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In to Walmart</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          
          {/* Email/Password Tab */}
          <TabsContent value="email" className="space-y-4">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={emailForm.name}
                    onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={emailForm.confirmPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
          
          {/* Google Tab */}
          <TabsContent value="google" className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn} 
              className="w-full" 
              disabled={isLoading}
              variant="outline"
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isLoading ? 'Signing In...' : 'Sign in with Google'}
            </Button>
          </TabsContent>
          
          {/* Phone Tab */}
          <TabsContent value="phone" className="space-y-4">
            {!verificationId ? (
              <form onSubmit={handlePhoneVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneForm.phoneNumber}
                      onChange={(e) => setPhoneForm({ ...phoneForm, phoneNumber: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Verification code sent to {phoneForm.phoneNumber}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={phoneForm.verificationCode}
                    onChange={(e) => setPhoneForm({ ...phoneForm, verificationCode: e.target.value })}
                    maxLength={6}
                  />
                </div>
                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {(error || localError) && (
          <div className="text-red-500 text-sm text-center">
            {error || localError}
          </div>
        )}
        
        {/* reCAPTCHA container for phone auth */}
        <div id="recaptcha-container"></div>
      </DialogContent>
    </Dialog>
  );
}
