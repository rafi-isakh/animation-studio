import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const formData = await req.formData();

    if (!session || !session.user) {
        return NextResponse.json({
            "message": "Unauthorized",
            "status": 401
        });
    }

    const title = formData.get('title')
    const description = formData.get('description')
    const coverArt = formData.get('coverArt') as File
    const genre = formData.get('genre')
    const language = formData.get('language')
    const isAdultMaterial = formData.get('is_adult_material')

    if (!title || !description || !coverArt || !genre) {
        return NextResponse.json({ error: 'Missing web novel data' }, { status: 400 });
    }

    const fileType = coverArt.type;
    const fileContent = Buffer.from(await coverArt.arrayBuffer());

    const fileNameResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_random_filename`);
    const fileName = await fileNameResponse.json() + ".webp";

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


    const data = {
        user_email: session.user.email,
        title: title,
        description: description,
        cover_art: fileName,
        genre: genre,
        language: language,
        available_languages: JSON.stringify([language]),
        is_adult_material: isAdultMaterial
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_webnovel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Error adding webnovel:', error);
        console.error("Payload: ", data);
        return NextResponse.json({
            message: "Add webnovel failed: " + error,
        }, {
            status: response.status
        });
    }


    const r = await response.json();

    try {
        // notify staff that new webnovel has been uploaded
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "jongminbaek@stelland.io, dami@stelland.io",
            subject: "New community webnovel has been uploaded",
            text: `New community webnovel has been uploaded: ${title} by ${session.user.email}`,
            html: `<p>New community webnovel has been uploaded: <a href="${process.env.NEXT_PUBLIC_HOST}/webnovel/${r.id}">${title}</a> by ${session.user.email}</p><p>Please trigger a translation job for it manually.</p>`
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }

    revalidateTag('webnovels');

    return NextResponse.json({
        message: "Add webnovel success",
        id: r.id
    }, {
        status: 200,
    });
}
