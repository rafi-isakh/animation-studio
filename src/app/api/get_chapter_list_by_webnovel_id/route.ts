import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    // const session = await auth();
    const webnovelId = request.nextUrl.searchParams.get('webnovel_id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_list_by_webnovel_id?id=${webnovelId}`);

    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to get chapter list: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    const data = await response.json();
    return NextResponse.json(data);
}