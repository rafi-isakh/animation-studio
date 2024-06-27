import { NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST() {
  try {
    "use server"
    await signOut();
    return NextResponse.json({ message: 'Signed out' });
  } catch (error) {
    console.log(error);
    throw error;
    return NextResponse.json({ message: 'Failed to sign out' }, { status: 500 });
  }
}
