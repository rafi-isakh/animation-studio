import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrlForWebtoonImage } from '@/utils/s3';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') as string;
    const signedUrl = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/get_signed_url?key=${key}`);
    return NextResponse.json({ signedUrl });
}