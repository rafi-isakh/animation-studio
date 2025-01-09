import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const PICTURES_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const WEBTOONS_BUCKET_NAME = "toonyzwebtoonsbucket"
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

export const uploadFile = async (fileBuffer: Buffer, fileName: string, fileType: string) => {

  const params = {
    Bucket: PICTURES_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: fileType
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    return data;
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
};

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
