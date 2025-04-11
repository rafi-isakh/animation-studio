import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { Webnovel } from "@/components/Types";

export async function GET(request: Request) {
    const session = await auth();
    const parsedUrl = new URL(request.url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    let url = new URL(`${baseUrl}/view_profile`);
    if (session && session.user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_session_user`,
            {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Provider': session.provider
                }
            }
        )

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch user by email ${session.user.email}` }, { status: response.status });
        }
        const data = await response.json();

        if (!data.id) {
            return NextResponse.json({  error: 'No id returned' }, { status: response.status });
        }
            
        const id = data.id;
        url.pathname += `/${id}`;
    }
    else {
        url = new URL(`${baseUrl}/signin`)
    }
    return NextResponse.redirect(url);
}