import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
    console.log("upload_picture_to_s3");
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { fileBufferBase64, fileName, fileType } = await request.json();
    console.log("fileBufferBase64", fileBufferBase64);
    console.log("fileName", fileName);
    console.log("fileType", fileType);
    const fileBuffer = Buffer.from(fileBufferBase64, 'base64');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/upload_picture_to_s3`, {
        method: 'POST',
        body: JSON.stringify({ fileBufferBase64: fileBuffer.toString('base64'), fileName, fileType }),
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
    return NextResponse.json({
        message: "Upload to s3 successful",
    }, {
        status: 200
    });
};
