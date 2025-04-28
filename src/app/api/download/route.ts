import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";
import { s3Client } from "@/utils/s3";

export async function GET(request: NextRequest) {
    // const session = await auth();
    // if (!session) {
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    try {
        const { searchParams } = new URL(request.url);
        const file = searchParams.get("file");
        // const language = searchParams.get("language");
        
        console.log('Download API called with file param:', file);
        console.log('All search params:', Object.fromEntries(searchParams.entries()));

        if (!file) {
            console.log('File parameter is missing');
            return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
        }

        const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
        console.log('Using bucket:', bucketName);
        
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: file,
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        return NextResponse.redirect(signedUrl);
        
        // Option 2: Stream the file directly through the server (alternative approach)
        /*
        const { Body, ContentType } = await s3Client.send(command);
        const arrayBuffer = await Body.transformToByteArray();
        
        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": ContentType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${file.split('/').pop()}"`,
            },
        });
        */
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: "Failed to download file" },
            { status: 500 }
        );
    }
} 