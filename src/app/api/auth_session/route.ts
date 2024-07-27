import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth';
import { User } from '@/components/Types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session && session.user) {
      return NextResponse.json({ 
        loggedIn: true,
      });
    } else {
      return NextResponse.json({ 
        loggedIn: false,
      });
    }
  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json({ loggedIn: false, error: 'Internal Server Error' }, { status: 500 });
  }
}