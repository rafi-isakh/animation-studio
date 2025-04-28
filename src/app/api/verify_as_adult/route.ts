import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/verify_as_adult`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${session.accessToken}`,
            "Provider": session.provider,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.text();
        return new NextResponse(error, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}