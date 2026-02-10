import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/mithrilAuth';
import { updateUser, deleteUser } from '@/components/Mithril/services/firestore/mithrilUsers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { displayName, role, isActive, password } = body;

    const updates: {
      displayName?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    } = {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || !displayName.trim()) {
        return NextResponse.json(
          { error: 'Display name cannot be empty' },
          { status: 400 }
        );
      }
      updates.displayName = displayName.trim();
    }

    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      updates.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean' },
          { status: 400 }
        );
      }

      // Prevent admin from deactivating themselves
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.id === userId && !isActive) {
        return NextResponse.json(
          { error: 'Cannot deactivate your own account' },
          { status: 400 }
        );
      }

      updates.isActive = isActive;
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      updates.password = password;
    }

    await updateUser(userId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // Prevent admin from deleting themselves
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
