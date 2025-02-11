import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email_hash = searchParams.get('email_hash');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_metadata_by_email_hash?email_hash=${email_hash}`);
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to get webnovels by email hash: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    const data = await response.json();
    return NextResponse.json(data);
}