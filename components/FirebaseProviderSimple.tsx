"use client";

import { useEffect, useState } from 'react';
import { useFirebaseAuthStore } from '@/store/firebaseAuthStore';

export default function FirebaseProviderSimple({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client-side after hydration
    if (!isClient || typeof window === 'undefined') return;

    // Dynamically import Firebase auth service only on client-side
    const initializeAuth = async () => {
      try {
        const { FirebaseAuthService } = await import('@/lib/firebaseAuthClient');
        
        // Check for redirect result first
        try {
          const redirectResult = await FirebaseAuthService.handleGoogleRedirectResult();
          if (redirectResult.success && redirectResult.user) {
            useFirebaseAuthStore.setState({
              user: redirectResult.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return; // Don't set up listener if we got redirect result
          }
        } catch (redirectError) {
          // No redirect result, continue with normal auth state listener
        }
        
        // Set up Firebase auth state listener
        const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
          if (user) {
            useFirebaseAuthStore.setState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            useFirebaseAuthStore.setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        });

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize Firebase auth:', error);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;
    
    initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isClient]);

  return <>{children}</>;
}
