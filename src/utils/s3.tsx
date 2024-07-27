import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
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
    Bucket: BUCKET_NAME,
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
