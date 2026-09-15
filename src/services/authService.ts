// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "resident" | "admin";
  purok?: string;
  contactNumber?: string;
  createdAt?: any;
}

// 🔐 Register
export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  role: "resident" | "admin",
  purok: string,
  contactNumber: string
): Promise<UserProfile> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    fullName,
    role,
    purok,
    contactNumber,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return profile;
};

// 🔑 Login
export const loginUser = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// 🚪 Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// 👤 Get profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// 🔄 Auth state listener
export const onAuthChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);