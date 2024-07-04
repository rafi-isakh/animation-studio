import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session && session.user) {
      return NextResponse.json({ 
        loggedIn: true,
        username: session.user.name,
        email: session.user.email,
        id: session.user.id,
      });
    } else {
      return NextResponse.json({ 
        loggedIn: false,
        username: "",
        email: "",
        id: "",
      });
    }
  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json({ loggedIn: false, error: 'Internal Server Error' }, { status: 500 });
  }
}