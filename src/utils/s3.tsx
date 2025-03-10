import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest } from "next/server";
import { Readable } from "stream";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const PICTURES_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const WEBTOONS_BUCKET_NAME = "toonyzwebtoonsbucket"
const VIDEOS_BUCKET_NAME = "toonyzvideosbucket"
const AWS_S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY ?? "";
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY ?? "";


const credentials = {
    accessKeyId: AWS_S3_ACCESS_KEY,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY
}

const s3Client = new S3Client({
    credentials,
    region: REGION
});

export const uploadFile = async (bucketName: string, fileBuffer: Buffer, fileName: string, fileType: string, req: NextRequest) => {

    await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/upload_picture_to_s3`, {
        method: 'POST',
        body: JSON.stringify({ fileBufferBase64: fileBuffer.toString('base64'), fileName, fileType, bucketName }),
        headers: {
            cookie: req.headers.get('cookie') || ''
        }
    });
}


export const listObjectsInWebtoonsDirectory = async (directoryPrefix: string) => {
    const params = {
        Bucket: WEBTOONS_BUCKET_NAME,
        Prefix: directoryPrefix
    };

    try {
        const data = await s3Client.send(new ListObjectsV2Command(params));
        if (data.Contents) {
            const withoutDots = data.Contents.map(item => item.Key).filter(str => !str?.split("/").some(s => s.startsWith(".")));
            return withoutDots;
        } else {
            return [];
        }
    } catch (err) {
        console.error("Error listing objects:", err);
        throw err;
    }
};

export async function getSignedUrlForWebtoonImage(key: string) {
    const command = new GetObjectCommand({ Bucket: WEBTOONS_BUCKET_NAME, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
    return signedUrl;
}

// Download video and upload to S3
export const downloadAndUploadVideo = async (videoUrl: string) => {
    try {
        // Fetch the video from the URL
        console.log(videoUrl);
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const videoBlob = await response.arrayBuffer();
        const videoBuffer = Buffer.from(videoBlob);
        // Upload to S3
        const fileName = `video_${Date.now()}.mp4`; // Generate unique filename

        const uploadParams = {
            Bucket: VIDEOS_BUCKET_NAME,
            Key: fileName,
            Body: videoBuffer,
            ContentType: 'video/mp4'
        };

        const uploadResult = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log('Video uploaded successfully:', uploadResult);

        return fileName;
    } catch (error) {
        console.error('Error downloading and uploading video:', error);
        throw error;
    }
};

export const downloadVideo = async (videoUrl: string) => {
    console.log(videoUrl);
    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.arrayBuffer();
    const videoBuffer = Buffer.from(videoBlob);
    return videoBuffer.toString('base64');
}

export const uploadVideo = async (videoBuffer: Buffer<ArrayBuffer>) => {
    const fileName = `video_${Date.now()}.mp4`; // Generate unique filename
    const uploadParams = {
        Bucket: VIDEOS_BUCKET_NAME,
        Key: fileName,
        Body: videoBuffer,
        ContentType: 'video/mp4'
    };
    try {
        const uploadResult = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log('Video uploaded successfully:', uploadResult);
        return fileName;
    } catch (error) {
        console.error('Error uploading video:', error);
        throw error;
    }
};