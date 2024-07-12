import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { Webnovel } from "@/components/Types";

export async function GET(request: Request) {
    const session = await auth();
    let url = new URL('http://localhost:3000/view_webnovels');
    if (session && session.user) {
        const response = await fetch(`http://stellandai.com:5000/api/get_webnovel_byuser?user_email=${session.user.email}`)
        const data = await response.json();
        if (data.length > 0) {
            const ids = data.map((w: Webnovel) => w.id);
            const first = Math.min(...ids);
            url.searchParams.set("id", first.toString());
        }
    }
    else {
        url = new URL('http://localhost:3000/signin')
    }
    return NextResponse.redirect(url);
}