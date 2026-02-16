import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Get the download URL for a MEP's profile photo
 * @param mepId - The MEP's ID
 * @returns Promise with the download URL
 */
export const getMepPhotoURL = async (mepId: number): Promise<string> => {
  try {
    const photoRef = ref(storage, `meps/${mepId}.jpeg`);
    const url = await getDownloadURL(photoRef);
    return url;
  } catch (error: any) {
    // If photo doesn't exist, return a placeholder
    console.warn(`Photo not found for MEP ${mepId}`);
    return '/img/placeholder-avatar.png';
  }
};

/**
 * Get a direct storage URL (faster, but requires public read access)
 * Use this if your storage rules allow public read
 * @param mepId - The MEP's ID
 * @returns The direct storage URL
 */
export const getMepPhotoDirectURL = (mepId: number): string => {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/meps%2F${mepId}.jpeg?alt=media`;
};

/**
 * Preload multiple MEP photos for better performance
 * @param mepIds - Array of MEP IDs
 * @returns Promise with a map of MEP ID to photo URL
 */
export const preloadMepPhotos = async (
  mepIds: number[]
): Promise<Record<number, string>> => {
  const urls: Record<number, string> = {};

  await Promise.all(
    mepIds.map(async (id) => {
      urls[id] = await getMepPhotoURL(id);
    })
  );

  return urls;
};
