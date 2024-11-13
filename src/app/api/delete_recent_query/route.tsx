import { auth } from "@/auth";
import { NextResponse } from "next/server"

import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');
    const query_index = request.nextUrl.searchParams.get('query_index');
    console.log(email, query_index)
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_recent_query?email=${email}&query_index=${query_index}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.accessToken}`,
                    "Provider": session.provider
                },
            }
        )
        if (!response.ok) {
            return NextResponse.json({ error: "error deleting recent query" }, { status: 500 })
        }
        const data = await response.json()
        return NextResponse.json('success')
    } catch (error) {
        console.error("Error deleting recent query", error)
        return NextResponse.json({ error: "error deleting recent query" }, { status: 500 })
    }
}