import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { ChapterDocument, SaveChapterInput } from './types';

const getChapterRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'chapter', 'data');

/**
 * Get chapter document
 */
export async function getChapter(projectId: string): Promise<ChapterDocument | null> {
  const docRef = getChapterRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as ChapterDocument;
}

/**
 * Save chapter document
 */
export async function saveChapter(
  projectId: string,
  input: SaveChapterInput
): Promise<void> {
  const docRef = getChapterRef(projectId);

  await setDoc(docRef, {
    content: input.content,
    filename: input.filename,
    uploadType: input.uploadType,
    uploadedAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Delete chapter document
 */
export async function deleteChapter(projectId: string): Promise<void> {
  const docRef = getChapterRef(projectId);
  await deleteDoc(docRef);
}