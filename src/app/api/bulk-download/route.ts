import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth"; // Assuming auth is needed for bulk downloads too
import { s3Client } from "@/utils/s3";
import { Readable } from 'stream'; // Import Readable stream type

// Helper to convert ReadableStream to Buffer for JSZip
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
    // Check authentication
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Expecting S3 object keys now, not full URLs
        const { keys } = await req.json() as { keys: string[] }; 

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: 'Invalid input: \'keys\' must be a non-empty array of S3 object keys.' }, { status: 400 });
        }

        console.log(`Received request to bulk download ${keys.length} S3 keys.`);

        const zip = new JSZip();
        let filesAdded = 0;
        const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

        if (!bucketName) {
             console.error('S3 bucket name is not configured.');
             return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        // Fetch files directly from S3 using keys
        const filePromises = keys.map(async (key) => {
            if (!key || typeof key !== 'string' || key.trim() === '') {
                console.warn(`Skipping invalid key: ${key}`);
                return null;
            }
            try {
                console.log(`Fetching S3 object: Bucket=${bucketName}, Key=${key}`);
                const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
                const { Body, ContentLength } = await s3Client.send(command);

                if (Body instanceof ReadableStream) {
                    // Extract filename from the key
                    const name = key.substring(key.lastIndexOf('/') + 1) || key;
                    console.log(`Processing ${name} (Size: ${ContentLength}). Adding to zip...`);
                    // Convert stream to buffer for JSZip
                    const buffer = await streamToBuffer(Body);
                    zip.file(name, buffer); // Add file content to zip
                    console.log(`Added ${name} to zip.`);
                    return { success: true, name };
                } else {
                    console.warn(`Could not get readable stream for key: ${key}`);
                    return null;
                }
            } catch (error) {
                console.error(`Error fetching S3 object key ${key}:`, error);
                return null; // Return null if fetching this specific key fails
            }
        });

        // Wait for all S3 fetches and zipping operations
        const results = await Promise.all(filePromises);
        filesAdded = results.filter(r => r?.success).length;

        if (filesAdded === 0) {
            console.error('Failed to fetch or add any files from S3.');
            return NextResponse.json({ error: 'Failed to retrieve any of the requested files from storage.' }, { status: 500 });
        }

        console.log(`Generating zip archive with ${filesAdded} files...`);

        // Generate the zip file content
        const zipBuffer = await zip.generateAsync({ 
            type: 'nodebuffer',
            compression: "DEFLATE", // Add compression
            compressionOptions: {
                level: 6 // Default compression level
            }
        });

        console.log("Zip archive generated successfully.");

        // Create the response
        const response = new NextResponse(zipBuffer);
        response.headers.set('Content-Type', 'application/zip');
        response.headers.set('Content-Disposition', `attachment; filename="download_${Date.now()}.zip"`);

        return response;

    } catch (error) {
        console.error('Bulk download API error:', error);
        // Basic error message to client
        return NextResponse.json({ error: 'Failed to create zip file.' }, { status: 500 });
    }
}

export async function OPTIONS() {
    // Same OPTIONS handler as before
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*', // Adjust as needed
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
} 