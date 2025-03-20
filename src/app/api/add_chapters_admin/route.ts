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
    console.log(data);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_chapters_admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        return NextResponse.json({
            message: "Failed to add chapters",
        }, {
            status: response.status
        });
    }
    return NextResponse.json({
        message: "Add chapter successful",
    });
}