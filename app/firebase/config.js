import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Correct import for getAuth
import { getFirestore } from "firebase/firestore";

/* const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || process.env.AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || process.env.PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || process.env.MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID || process.env.APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID || process.env.MEASUREMENT_ID,
}; */

const firebaseConfig = {
  apiKey: 'AIzaSyBevPCYNaBaiqpxkqFHokkEneyr3Dl3oKI',
  authDomain: 'hella-business.firebaseapp.com',
  projectId: 'hella-business',
  storageBucket: 'hella-business.appspot.com',
  messagingSenderId: '274387046707',
  appId: '1:274387046707:web:fe3df724d5b826e1bb6e46',
  measurementId: 'G-2KDC534126',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
