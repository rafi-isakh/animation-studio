import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  MithrilUser,
  MithrilSession,
  MithrilUserPublic,
  MithrilUserAdmin,
  CreateMithrilUserInput,
} from './types';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

const USERS_COLLECTION = 'mithrilUsers';
const SESSIONS_COLLECTION = 'mithrilSessions';

// ============================================
// User Operations
// ============================================

/**
 * Get a user by email
 */
export async function getUserByEmail(
  email: string
): Promise<MithrilUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const q = query(
    collection(db, USERS_COLLECTION),
    where('email', '==', normalizedEmail)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return {
    id: userDoc.id,
    ...userDoc.data(),
  } as MithrilUser;
}

/**
 * Get a user by ID
 */
export async function getUserById(
  userId: string
): Promise<MithrilUser | null> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as MithrilUser;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(docRef, {
    lastLoginAt: Timestamp.now(),
  });
}

/**
 * Convert MithrilUser to public version (without passwordHash)
 */
export function toPublicUser(user: MithrilUser): MithrilUserPublic {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  };
}

/**
 * Convert MithrilUser to admin version (includes isActive, timestamps)
 */
export function toAdminUser(user: MithrilUser): MithrilUserAdmin {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    isActive: user.isActive,
    createdAt: user.createdAt ? user.createdAt.toDate().toISOString() : null,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toDate().toISOString() : null,
  };
}

/**
 * Create a new Mithril user (admin only)
 */
export async function createUser(input: CreateMithrilUserInput): Promise<string> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('Email already exists');
  }

  const now = Timestamp.now();
  const passwordHash = bcrypt.hashSync(input.password, BCRYPT_ROUNDS);

  const userData = {
    email: normalizedEmail,
    passwordHash,
    role: input.role,
    displayName: input.displayName,
    createdAt: now,
    createdBy: input.createdBy,
    lastLoginAt: null,
    isActive: true,
  };

  const docRef = await addDoc(collection(db, USERS_COLLECTION), userData);
  return docRef.id;
}

/**
 * List all users (admin only)
 */
export async function listUsers(): Promise<MithrilUserAdmin[]> {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));

  return snapshot.docs.map((docSnap) => {
    const user = {
      id: docSnap.id,
      ...docSnap.data(),
    } as MithrilUser;
    return toAdminUser(user);
  });
}

/**
 * Update user details (admin only)
 */
export async function updateUser(
  userId: string,
  updates: {
    displayName?: string;
    role?: string;
    isActive?: boolean;
    password?: string;
  }
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);

  const updateData: { [key: string]: string | boolean } = {};

  if (updates.displayName !== undefined) {
    updateData.displayName = updates.displayName;
  }

  if (updates.role !== undefined) {
    updateData.role = updates.role;
  }

  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }

  if (updates.password) {
    updateData.passwordHash = bcrypt.hashSync(updates.password, BCRYPT_ROUNDS);
  }

  await updateDoc(docRef, updateData);
}

/**
 * Delete a user and all their sessions (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  await deleteUserSessions(userId);

  const docRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(docRef);
}

// ============================================
// Session Operations
// ============================================

/**
 * Create a new session
 */
export async function createSession(
  sessionId: string,
  user: MithrilUser,
  expiresInDays: number = 7
): Promise<MithrilSession> {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  );

  const session: MithrilSession = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    expiresAt,
    createdAt: now,
  };

  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await setDoc(docRef, session);

  return session;
}

/**
 * Get a session by ID
 */
export async function getSession(
  sessionId: string
): Promise<MithrilSession | null> {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const session = {
    id: docSnap.id,
    ...docSnap.data(),
  } as MithrilSession;

  // Check if session has expired
  if (session.expiresAt.toDate() < new Date()) {
    // Session expired, delete it
    await deleteSession(sessionId);
    return null;
  }

  return session;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await deleteDoc(docRef);
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}