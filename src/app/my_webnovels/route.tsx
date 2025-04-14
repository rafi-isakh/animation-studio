import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { Webnovel } from "@/components/Types";

export async function GET(request: Request) {
    const session = await auth();
    const parsedUrl = new URL(request.url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    let url = new URL(`${baseUrl}/view_webnovels`);
    if (session && session.user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_by_email?email=${session.user.email}`)
        const data = await response.json();
        if (data.length > 0) {
            const ids = data.map((w: Webnovel) => w.id); // same code as in ViewWebnovelsComponent
            const first = Math.min(...ids);
            url = new URL(`${baseUrl}/view_webnovels/${first}`);
        }
    }
    else {
        url = new URL(`${baseUrl}/signin`)
    }
    return NextResponse.redirect(url);
}