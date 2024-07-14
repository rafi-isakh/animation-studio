import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth';
import { User } from '@/components/Types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session && session.user) {
      const email = session.user.email
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user?email=${email}`)
      const data = await response.json();
      const user: User = data;

      return NextResponse.json({ 
        loggedIn: true,
        nickname: user.nickname,
        email: user.email,
      });
    } else {
      return NextResponse.json({ 
        loggedIn: false,
        nickname: "",
        email: "",
      });
    }
  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json({ loggedIn: false, error: 'Internal Server Error' }, { status: 500 });
  }
}