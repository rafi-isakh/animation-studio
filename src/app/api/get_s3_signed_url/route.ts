import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrlForWebtoonImage } from '@/utils/s3';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const signedUrl = await getSignedUrlForWebtoonImage(key as string);
    return NextResponse.json({ signedUrl });
}