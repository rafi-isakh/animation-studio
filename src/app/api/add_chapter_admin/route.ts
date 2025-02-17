import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }
    const data = await req.json();
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_chapter_admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(data),
    });
    return NextResponse.json({
        message: "Add chapter successful",
    });
}