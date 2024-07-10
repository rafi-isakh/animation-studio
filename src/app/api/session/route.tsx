import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session && session.user) {
      return NextResponse.json({ 
        loggedIn: true,
        username: session.user.name,
        email: session.user.email,
      });
    } else {
      return NextResponse.json({ 
        loggedIn: false,
        username: "",
        email: "",
      });
    }
  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json({ loggedIn: false, error: 'Internal Server Error' }, { status: 500 });
  }
}