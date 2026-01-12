import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/mithrilAuth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'An error occurred checking session' },
      { status: 500 }
    );
  }
}