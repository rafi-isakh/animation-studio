import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { Webnovel } from "@/components/Types"
import { signOut } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    const parsedUrl = new URL(request.url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    let url = new URL(`${baseUrl}/view_profile`);
    
    if (session && session.user) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_session_user`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                        'Provider': session.provider
                    }
                }
            )

            if (!response.ok) {
                await signOut();
                url = new URL(`${baseUrl}/signin`);
                return NextResponse.redirect(url);
            }
            
            const data = await response.json();

            if (!data.id) {
                return NextResponse.json({ error: 'No id returned' }, { status: response.status });
            }
                
            const id = data.id;
            url.pathname += `/${id}`;
        } catch (error) {
            console.error('Error fetching user data:', error);
            url = new URL(`${baseUrl}/signin`);
            return NextResponse.redirect(url);
        }
    } else {
        url = new URL(`${baseUrl}/signin`);
    }
    
    return NextResponse.redirect(url);
}