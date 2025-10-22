"use client";

import { useEffect, useState } from 'react';
import { useFirebaseAuthStore } from '@/store/firebaseAuthStore';

export default function FirebaseProviderClient({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client-side after hydration
    if (!isClient || typeof window === 'undefined') return;

    // Dynamically import Firebase auth service
    import('@/lib/firebaseAuthClient').then(({ FirebaseAuthService }) => {
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

      // Cleanup listener on unmount
      return () => unsubscribe();
    }).catch((error) => {
      console.error('Failed to initialize Firebase auth:', error);
    });
  }, [isClient]);

  return <>{children}</>;
}
