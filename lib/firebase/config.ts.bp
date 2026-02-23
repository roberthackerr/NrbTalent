// lib/firebase/config.ts
import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDby30Y9lFHqHrv6u4FsFTwd7NtK3P_h-E",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "nrbtalents.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "nrbtalents",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "nrbtalents.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "941328633556",
  appId: process.env.FIREBASE_APP_ID || "1:941328633556:web:ab5e868dbbb2d089163541",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-3R3H5VLR53"
};

// Initialize Firebase
let firebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const storage = getStorage(firebaseApp);
export default firebaseApp;