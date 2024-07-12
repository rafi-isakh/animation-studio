import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { Webnovel } from "@/components/Types";

export async function GET(request: Request) {
    const session = await auth();
    const parsedUrl = new URL(request.url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    let url = new URL(`${baseUrl}/view_webnovels`);
    if (session && session.user) {
        const response = await fetch(`https://toonyzbackend.site/api/get_webnovel_byuser?user_email=${session.user.email}`)
        const data = await response.json();
        if (data.length > 0) {
            const ids = data.map((w: Webnovel) => w.id);
            const first = Math.min(...ids);
            url.searchParams.set("id", first.toString());
        }
    }
    else {
        url = new URL(`${baseUrl}/signin`)
    }
    return NextResponse.redirect(url);
}