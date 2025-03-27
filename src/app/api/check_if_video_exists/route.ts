import { NextRequest, NextResponse } from "next/server";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    const response = await fetch(getVideoUrl(url), { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');
    if (contentType?.startsWith('video/')) {
        return NextResponse.json({ videoExists: true });
    } else {
        return NextResponse.json({ videoExists: false });
    }
}