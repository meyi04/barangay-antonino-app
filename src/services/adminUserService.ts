import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db, functions } from '../firebase/config';
import type { UserProfile } from './authService';

export const getAdminUserProfiles = async (): Promise<UserProfile[]> => {
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', 'in', ['resident', 'admin'])));
  return snapshot.docs.map((user) => ({ ...user.data(), uid: user.id }) as UserProfile);
};

export const updateAdminUserProfile = async (
  uid: string,
  updates: Pick<UserProfile, 'fullName' | 'purok' | 'contactNumber'>
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), updates);
};

export const deleteResidentAccount = async (uid: string): Promise<void> => {
  const removeResident = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteResidentAccount');
  const result = await removeResident({ uid });
  if (!result.data.success) {
    throw new Error('The account removal was not confirmed by the server.');
  }
};
