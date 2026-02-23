import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAdlgwKtpMg7F4gc4RIy_qiBKUCS47MOZE",
  authDomain: "teeth-manager-eeb41.firebaseapp.com",
  projectId: "teeth-manager-eeb41",
  storageBucket: "teeth-manager-eeb41.firebasestorage.app",
  messagingSenderId: "105085749403",
  appId: "1:105085749403:web:0621a8567b0db3c95f1e3e",
  measurementId: "G-LCX7VJCCGB",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

import { getFirestore } from "firebase/firestore";

export const db = getFirestore(app);

export default app;
