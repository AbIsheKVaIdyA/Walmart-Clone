// Client-side only Firebase configuration
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

// Initialize Firebase only on client-side
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;

if (typeof window !== 'undefined') {
  // Initialize Firebase (prevent multiple initializations)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
}

export { auth, db, storage, analytics };
export default app;
