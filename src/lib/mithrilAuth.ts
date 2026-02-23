import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import {
  getSession,
  createSession,
  deleteSession,
  getUserByEmail,
  updateLastLogin,
  toPublicUser,
  createUser,
} from '@/components/Mithril/services/firestore/mithrilUsers';
import type { MithrilSession, MithrilUserPublic } from '@/components/Mithril/services/firestore/types';

const BCRYPT_ROUNDS = 12;
const SESSION_COOKIE_NAME = 'mithril_session';
const SESSION_DURATION_DAYS = 7;

/**
 * Hash a password using bcrypt
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // seconds
    path: '/',
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the session ID from cookies
 */
export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value ?? null;
}

/**
 * Get the current session from cookies
 */
export async function getCurrentSession(): Promise<MithrilSession | null> {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return null;
  }

  return getSession(sessionId);
}

/**
 * Get the current user from session
 */
export async function getCurrentUser(): Promise<MithrilUserPublic | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
    role: session.role,
    displayName: session.displayName,
  };
}

/**
 * Login with email and password
 * Returns user public data on success, null on failure
 */
export async function login(
  email: string,
  password: string
): Promise<{ user: MithrilUserPublic } | { error: string }> {
  // Find user by email
  const user = await getUserByEmail(email);

  if (!user) {
    return { error: 'Invalid email or password' };
  }

  // Check if user is active
  if (!user.isActive) {
    return { error: 'Account is disabled' };
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    return { error: 'Invalid email or password' };
  }

  // Create session
  const sessionId = generateSessionId();
  await createSession(sessionId, user, SESSION_DURATION_DAYS);

  // Set cookie
  await setSessionCookie(sessionId);

  // Update last login
  await updateLastLogin(user.id);

  return { user: toPublicUser(user) };
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<void> {
  const sessionId = await getSessionIdFromCookie();
  if (sessionId) {
    await deleteSession(sessionId);
  }
  await clearSessionCookie();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.role === 'admin';
}

/**
 * Register a new user with role 'user' and auto-login
 */
export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: MithrilUserPublic } | { error: string }> {
  try {
    const userId = await createUser({
      email,
      password,
      displayName,
      role: 'user',
      createdBy: 'self',
    });

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return { error: 'Registration failed' };
    }

    const sessionId = generateSessionId();
    await createSession(sessionId, { ...user, id: userId }, SESSION_DURATION_DAYS);
    await setSessionCookie(sessionId);

    return { user: toPublicUser({ ...user, id: userId }) };
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already exists') {
      return { error: 'An account with this email already exists' };
    }
    return { error: 'Registration failed' };
  }
}