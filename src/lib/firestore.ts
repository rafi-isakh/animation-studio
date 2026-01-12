import { getFirestore, Firestore } from 'firebase/firestore';
import { app } from './firebase';

// Initialize Firestore
const db: Firestore = getFirestore(app);

export { db };