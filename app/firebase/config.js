import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBevPCYNaBaiqpxkqFHokkEneyr3Dl3oKI",
  authDomain: "hella-business.firebaseapp.com",
  projectId: "hella-business",
  storageBucket: "hella-business.appspot.com",
  messagingSenderId: "274387046707",
  appId: "1:274387046707:web:fe3df724d5b826e1bb6e46",
  measurementId: "G-2KDC534126"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app); 

export { app, auth, firestore };