import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { User, UserRole } from '@/typings/authTypings';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Phone Auth Provider
const phoneProvider = new PhoneAuthProvider(auth);

// Firebase Auth Service (Client-side only)
export class FirebaseAuthService {
  // Email/Password Authentication
  static async signInWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        // Create default user data if not found
        const defaultUserData = {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          role: UserRole.CUSTOMER,
          createdAt: new Date(),
          updatedAt: new Date(),
          isEmailVerified: firebaseUser.emailVerified
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), defaultUserData);
        
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: defaultUserData.name,
          role: defaultUserData.role,
          createdAt: defaultUserData.createdAt,
          updatedAt: defaultUserData.updatedAt
        };
        
        return { success: true, user };
      }
      
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: userData.name,
        role: userData.role || UserRole.CUSTOMER,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date()
      };
      
      return { success: true, user };
    } catch (error: any) {
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email address' };
      } else if (error.code === 'auth/wrong-password') {
        return { success: false, error: 'Incorrect password' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed attempts. Please try again later' };
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your internet connection' };
      }
      
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  static async signUpWithEmail(email: string, password: string, name: string, role: UserRole = UserRole.CUSTOMER): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user document in Firestore
      const userData = {
        name,
        email: firebaseUser.email,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        phoneNumber: null,
        profileImage: null,
        isEmailVerified: firebaseUser.emailVerified
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Google Authentication with Popup
  static async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!auth || !db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      return await this.processGoogleUser(firebaseUser);
    } catch (error: any) {
      // Handle specific Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in popup was closed. Please try again.' };
      } else if (error.code === 'auth/popup-blocked') {
        return { success: false, error: 'Popup was blocked by browser. Please allow popups and try again.' };
      } else if (error.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Sign-in was cancelled. Please try again.' };
      }
      
      return { success: false, error: error.message || 'Google sign-in failed' };
    }
  }

  // Google Authentication with Redirect (fallback for COOP issues)
  static async signInWithGoogleRedirect(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      throw new Error(error.message || 'Google redirect sign-in failed');
    }
  }

  // Handle Google redirect result
  static async handleGoogleRedirectResult(): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!auth || !db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        return await this.processGoogleUser(result.user);
      } else {
        return { success: false, error: 'No redirect result found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to handle redirect result' };
    }
  }

  // Process Google user (shared logic)
  private static async processGoogleUser(firebaseUser: FirebaseUser): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    try {
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        // User exists, return their data
        const userData = userDoc.data();
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData.name,
          role: userData.role || UserRole.CUSTOMER,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: new Date()
        };
        return { success: true, user };
      } else {
        // New user, create document
        const userData = {
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email,
          role: UserRole.CUSTOMER, // Default to customer for Google sign-in
          createdAt: new Date(),
          updatedAt: new Date(),
          phoneNumber: firebaseUser.phoneNumber,
          profileImage: firebaseUser.photoURL,
          isEmailVerified: firebaseUser.emailVerified
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData.name,
          role: userData.role,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return { success: true, user };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to process Google user' };
    }
  }

  // Phone Authentication
  static async sendPhoneVerification(phoneNumber: string): Promise<{ success: boolean; verificationId?: string; error?: string }> {
    try {
      // Note: Phone authentication requires reCAPTCHA setup
      const appVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
      }, auth);
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      
      return { 
        success: true, 
        verificationId: confirmationResult.verificationId 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Sign Out
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Auth State Listener
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          if (userData) {
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role || UserRole.CUSTOMER,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date()
            };
            callback(user);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Update User Profile
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get User by ID
  static async getUserById(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user: User = {
          id: userId,
          email: userData.email,
          name: userData.name,
          role: userData.role || UserRole.CUSTOMER,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date()
        };
        return { success: true, user };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
