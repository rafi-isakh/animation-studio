import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';

export interface CustomMannequinTemplate {
  id: string;
  path: string;
  label: string;
}

const getCollection = () => collection(db, 'mannequinTemplates');

export async function getCustomMannequinTemplates(): Promise<CustomMannequinTemplate[]> {
  const snapshot = await getDocs(getCollection());
  return snapshot.docs.map((d) => ({
    id: d.id,
    path: (d.data() as { path: string; label: string }).path,
    label: (d.data() as { path: string; label: string }).label,
  }));
}

export async function addCustomMannequinTemplate(path: string, label: string): Promise<void> {
  await addDoc(getCollection(), { path, label, createdAt: Timestamp.now() });
}

export async function deleteCustomMannequinTemplate(id: string): Promise<void> {
  await deleteDoc(doc(getCollection(), id));
}
