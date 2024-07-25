import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/utils/s3'

export async function POST(req: NextRequest, res: NextResponse) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const email = formData.get('email');
  const bio = formData.get('bio');
  const nickname = formData.get('nickname');

  const fileType = file.type;
  const fileContent = Buffer.from(await file.arrayBuffer());

  const fileNameResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_random_filename`);
  const fileName = await fileNameResponse.json();
  console.log(fileType)
  console.log(fileName)
  try {
    const s3Response = await uploadFile(fileContent, fileName, fileType);
    console.log(s3Response);
  } catch (error) {
    console.error('Error uploading file to s3:', error);
    return NextResponse.json({
      "message": "Failed to upload to s3",
      "status": 500
    });
  }

  console.log("Keep going")
  const userData = {
    "email": email,
    "bio": bio,
    "nickname": nickname,
    "picture": fileName
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/update_user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    console.error("Error updating user", response.status)
    return NextResponse.json({
      "message": "Failed to update user",
      "status": 500
    });
  }

  return NextResponse.json({
    "message": "Success!!",
    "status": 200,
  });
}

