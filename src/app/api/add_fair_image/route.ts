import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {

  try {
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Convert file to buffer and base64
    const fileType = file.type || 'image/png';
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // generate filename (uuid)
    const { v4: uuidv4 } = await import('uuid');
    const fileName = `${uuidv4()}.webp`;

    // 1) Upload to S3 through your upload_picture_to_s3 endpoint
    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/upload_picture_to_s3`, {
      method: 'POST',
      body: JSON.stringify({
        fileBufferBase64: fileBuffer.toString('base64'),
        fileName,
        fileType,
        bucketName: 'toonyzbucket',
      }),
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      console.error('Upload to S3 failed:', errText);
      return NextResponse.json({ message: 'Upload to S3 failed' }, { status: 500 });
    }

    // 2) Call backend add_fair_image
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_fair_image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_name: fileName }),
    });

    if (!backendResponse.ok) {
      const errText = await backendResponse.text();
      console.error('Backend add_fair_image failed:', errText);
      return NextResponse.json({ message: 'Backend add_fair_image failed' }, { status: backendResponse.status });
    }

    return NextResponse.json({ message: 'Fair image uploaded and stored' }, { status: 200 });
  } catch (err) {
    console.error('Error in add_fair_image route:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
