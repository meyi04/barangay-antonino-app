// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "resident" | "admin";
  purok?: string;
  contactNumber?: string;
  profilePhoto?: string;
  createdAt?: Timestamp | FieldValue | null;
}

export const updateUserProfile = async (
  uid: string,
  updates: Pick<UserProfile, "fullName" | "purok" | "contactNumber">
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), updates);
};

export const updateUserProfilePhoto = async (
  uid: string,
  profilePhoto: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), { profilePhoto });
};

export const getResidentProfiles = async (): Promise<UserProfile[]> => {
  const residents = await getDocs(query(collection(db, "users"), where("role", "==", "resident")));
  return residents.docs.map((resident) => resident.data() as UserProfile);
};

export const uploadUserProfilePhoto = async (
  file: File
): Promise<string> => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photos must be JPG, PNG, or WebP images smaller than 5 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const loadedImage = new Image();
      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () => reject(new Error("The selected profile photo could not be read."));
      loadedImage.src = objectUrl;
    });

    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the profile photo.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
      const profilePhoto = canvas.toDataURL("image/jpeg", quality);
      if (profilePhoto.length <= 600_000) return profilePhoto;
    }
    throw new Error("This image could not be compressed enough to store in your profile. Choose a smaller image.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

// 🔐 Register
export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  purok: string,
  contactNumber: string
): Promise<UserProfile> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    fullName,
    role: 'resident',
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