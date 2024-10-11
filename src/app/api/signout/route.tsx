import { NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST() {
  // todo: don't do this, use client side signout
  try {
    "use server"
    await signOut();
    return NextResponse.json({ message: 'Signed out' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to sign out' }, { status: 500 });
  }
}
