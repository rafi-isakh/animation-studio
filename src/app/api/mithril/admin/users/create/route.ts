import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/mithrilAuth';
import { createUser } from '@/components/Mithril/services/firestore/mithrilUsers';
import type { MithrilUserRole } from '@/components/Mithril/services/firestore/types';

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, displayName, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const userId = await createUser({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      role: role as MithrilUserRole,
      createdBy: currentUser.id,
    });

    return NextResponse.json({ success: true, userId });
  } catch (error: unknown) {
    console.error('Create user error:', error);

    if (error instanceof Error && error.message === 'Email already exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
