import { NextRequest, NextResponse } from "next/server";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
// This is a poorly designed, temporary solution for showing videos instead of pictures
// for webnovels that have a video cover. The technical debt should be cleaned up by
// using proper architecture like putting a video cover field for the webnovel in the db.
// For now, what this does it it checks the toonyzvideosbucket (through cloudfront) to see
// if a file of the same name as the picture cover art (which is in toonyzbucket) exists. 
// if it does, it returns true.
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