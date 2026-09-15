// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHum_cyoSrtnanWJR7Rmxt3KzVIChCrgw",
  authDomain: "antonino-cf44b.firebaseapp.com",
  projectId: "antonino-cf44b",
  storageBucket: "antonino-cf44b.firebasestorage.app",
  messagingSenderId: "701874234514",
  appId: "1:701874234514:web:39710a2e42c6b113c0b24b",
  measurementId: "G-SPEQ289FF7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
