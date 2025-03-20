import { NextResponse } from "next/server";
import { auth } from "@/auth";
export async function POST(request: Request) {
    const { code } = await request.json();
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/check_promo_code`, {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            "Provider": session.provider,
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.detail }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}