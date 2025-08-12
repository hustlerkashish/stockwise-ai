import { initializeApp } from "firebase/app";
import {
  getAuth,
  // Email/Password
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Google Sign-in
  GoogleAuthProvider,       // <-- ADD
  signInWithPopup,          // <-- ADD
  // Core Functions
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- ADD GOOGLE PROVIDER ---
export const googleProvider = new GoogleAuthProvider();

// Export all functions for use in components
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, // <-- EXPORT
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
};