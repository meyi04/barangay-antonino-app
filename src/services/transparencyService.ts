import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, ref, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export function validateAttachment(file: File): string | null {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) return 'Choose a PDF, JPG, or PNG file.';
  if (file.size === 0) return 'This file is empty. Choose a different file.';
  if (file.type.startsWith('image/') && file.size > 600 * 1024) return 'Images must be 600 KB or smaller. Resize your image before uploading.';
  if (file.size > 10 * 1024 * 1024) return 'The attachment must be 10 MB or smaller.';
  return null;
}

export function uploadErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'storage/canceled': return 'Upload canceled. Your form details have been kept.';
    case 'storage/unauthorized': return 'File upload permission denied. Ask your administrator to check the staff role and Firebase Storage rules.';
    case 'permission-denied': return 'Publication permission denied. Ask your administrator to check the staff role and Firestore rules.';
    case 'storage/unauthenticated': case 'unauthenticated': return 'Your session has expired. Please sign in again.';
    case 'storage/bucket-not-found': case 'storage/no-default-bucket': case 'storage/project-not-found': return 'File storage is not configured. Ask your administrator to enable the project storage bucket.';
    case 'storage/quota-exceeded': return 'File storage quota has been exceeded. Ask your administrator to check Firebase usage and billing.';
    case 'storage/retry-limit-exceeded': case 'unavailable': return 'The connection timed out. Check your connection and try again.';
    default: return 'Unable to complete the operation. Check your connection and try again. Your form details have been kept.';
  }
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read image'));
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.onabort = () => reject(new Error('Image reading canceled'));
    reader.readAsDataURL(file);
  });
}

type Publication = { title: string; description: string; category: string; publishedBy: string; publishedByUid: string };
export async function publishBoardPost(data: Publication, file: File | null, onProgress: (percent: number) => void, onTask: (task: UploadTask | null) => void): Promise<void> {
  if (file) { const error = validateAttachment(file); if (error) throw new Error(error); }
  const postRef = doc(collection(db, 'transparencyPosts'));
  const isImage = !!file && file.type.startsWith('image/');
  const imageData = file && isImage ? await readImage(file) : '';
  const attachmentPath = file && !isImage ? `transparency/${postRef.id}/attachment` : '';
  let uploaded = false;
  try {
    if (file && !isImage) {
      const task = uploadBytesResumable(ref(storage, attachmentPath), file, { contentType: file.type });
      onTask(task);
      await new Promise<void>((resolve, reject) => {
        task.on('state_changed', (snapshot) => onProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)), reject, resolve);
      });
      uploaded = true;
      onTask(null);
    }
    await setDoc(postRef, { ...data, createdAt: serverTimestamp(), attachmentName: file?.name.slice(0, 255) || '', attachmentPath, imageData });
  } catch (error) {
    if (uploaded) {
      try { await deleteObject(ref(storage, attachmentPath)); }
      catch (cleanupError) { console.error('Unable to clean up unpublished attachment', attachmentPath, cleanupError); }
    }
    throw error;
  } finally { onTask(null); }
}
