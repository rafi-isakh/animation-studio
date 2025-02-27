import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { fileBufferBase64, fileName, fileType, bucketName } = await request.json();
    const fileBuffer = Buffer.from(fileBufferBase64, 'base64');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/upload_picture_to_s3`, {
        method: 'POST',
        body: JSON.stringify({ fileBufferBase64: fileBuffer.toString('base64'), fileName, fileType, bucketName }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    });
    if (!response.ok) {
        console.error("Error uploading file to s3:", response);
        return NextResponse.json({
            message: "Upload to s3 failed",
        }, {
            status: 500
        });
    }
    const data = await response.json();
    return NextResponse.json({
        message: "Upload to s3 successful",
    }, {
        status: 200
    });
};
