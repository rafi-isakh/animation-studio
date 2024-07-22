import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { Webnovel } from "@/components/Types";

export async function GET(request: Request) {
    const session = await auth();
    const parsedUrl = new URL(request.url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    let url = new URL(`${baseUrl}/view_profile`);
    if (session && session.user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_byemail?email=${session.user.email}`)
        const data = await response.json();
        const id = data.id;
        url.pathname += `/${id}`;
    }
    else {
        url = new URL(`${baseUrl}/signin`)
    }
    return NextResponse.redirect(url);
}