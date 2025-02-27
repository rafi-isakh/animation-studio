import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }
    const formData = await req.formData();

    const title = formData.get('title')
    const description = formData.get('description')
    const coverArt = formData.get('coverArt') as File
    const genre = formData.get('genre')
    const language = formData.get('language')
    const email = formData.get('email')
    const author = formData.get('author')

    const fileType = coverArt.type;
    const fileContent = Buffer.from(await coverArt.arrayBuffer());

    const fileNameResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_random_filename`);
    const fileName = await fileNameResponse.json();

    try {
        await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/upload_picture_to_s3`, {
          method: 'POST',
          body: JSON.stringify({ fileBufferBase64: fileContent.toString('base64'), fileName, fileType, bucketName: "toonyzbucket" }),
          headers: {
            cookie: req.headers.get('cookie') || ''
          }
        });
      } catch (error) {
        console.error('Error uploading file to s3:', error);
        return NextResponse.json({
          message: "Upload to s3 failed",
        }, {
          status: 500
        });
      }

    const send_data = {
        title: title,
        description: description,
        genre: genre,
        language: language,
        cover_art: fileName,
        user_email: email,
        author: author,
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_webnovel_admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(send_data),
    });


    if (!response.ok) {
        console.log(response);
        return NextResponse.json({
            message: "Add webnovel failed",
        }, {
            status: 500
        });
    }

    const data = await response.json();
    return NextResponse.json({
        message: "Add webnovel successful",
        id: data["id"]
    });
}