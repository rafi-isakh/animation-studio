import { NextResponse } from "next/server";

import { auth } from "@/auth";
export async function GET(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    console.log(session.user.email);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_transactions`, {
        headers: {
            "Authorization": `Bearer ${session.accessToken}`,
            "Provider": session.provider
        }
    });
    if (!response.ok) {
        console.log(response);
        return NextResponse.json({ error: response.statusText }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}
