"use client";

import { useEffect } from 'react';
import { FirebaseAuthService } from '@/lib/firebaseAuth';
import { useFirebaseAuthStore } from '@/store/firebaseAuthStore';

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { setLoading } = useFirebaseAuthStore();

  useEffect(() => {
    // Only set up listener on client-side
    if (typeof window === 'undefined') return;

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
  }, []);

  return <>{children}</>;
}
