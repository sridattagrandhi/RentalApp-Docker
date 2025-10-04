import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth"; // ← use getAuth, not initializeAuth
// AsyncStorage is only needed if you really want explicit persistence control.
// Expo Go’s WebSDK persistence is fine in most cases, so we don’t need initializeAuth here.
// import AsyncStorage from "@react-native-async-storage/async-storage";

//
// 1) Your Firebase Web SDK config — replace with your actual values:
//
const firebaseConfig = {
  apiKey: "AIzaSyDPnZrp4rdDxFp_nlOEvFtDapseVpjktKM",
  authDomain: "rentals-da2b8.firebaseapp.com",
  projectId: "rentals-da2b8",
    storageBucket: "rentals-da2b8.firebasestorage.app",
    messagingSenderId: "1071000464299",
    appId: "1:1071000464299:web:105d1cf7ea28e6515680ee",
    measurementId: "G-LMWC81S285"
};

//
// 2) Initialize or reuse the Firebase App instance:
//
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

//
// 3) Create the Auth instance from that App:
//
const auth: Auth = getAuth(app);

//
// 4) Export for use everywhere else:
//
export const FIREBASE_APP = app;
export const FIREBASE_AUTH = auth;

console.log(
  `firebaseConfig.ts: 🔥 Firebase initialized. FIREBASE_AUTH.app.name is "${auth.app.name}".`
);




