import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword, // <-- ADD
  reauthenticateWithCredential, // <-- ADD
  EmailAuthProvider // <-- ADD
} from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"; // <-- ADD MORE

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

// New function to add a stock to the watchlist
export const addToWatchlist = (userId, ticker) => {
  const watchlistRef = collection(db, 'users', userId, 'watchlist');
  return addDoc(watchlistRef, {
    ticker: ticker,
    addedAt: serverTimestamp()
  });
};

// Export firebase functions for use in components
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword, // <-- EXPORT
  reauthenticateWithCredential, // <-- EXPORT
  EmailAuthProvider // <-- EXPORT
};