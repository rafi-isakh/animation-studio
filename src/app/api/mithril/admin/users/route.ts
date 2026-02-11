import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/mithrilAuth';
import { listUsers } from '@/components/Mithril/services/firestore/mithrilUsers';

export async function GET() {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const users = await listUsers();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}
