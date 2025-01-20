import { NextRequest, NextResponse } from 'next/server';
import { listObjectsInWebtoonsDirectory } from '@/utils/s3';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const directory = searchParams.get('directory');
    const objects = await listObjectsInWebtoonsDirectory(directory as string);
    return NextResponse.json({ objects });
}