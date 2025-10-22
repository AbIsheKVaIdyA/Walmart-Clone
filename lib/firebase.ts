// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoVAb7yDSV2jLrRtP-VZhTekGhhAzjE0s",
  authDomain: "walmart-clone-50b37.firebaseapp.com",
  projectId: "walmart-clone-50b37",
  storageBucket: "walmart-clone-50b37.firebasestorage.app",
  messagingSenderId: "495690060513",
  appId: "1:495690060513:web:60cb8a7d9837bcc86c1da0",
  measurementId: "G-EKFBXXHJNL"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
