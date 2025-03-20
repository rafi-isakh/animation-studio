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
    const coverArt = formData.get('cover_art') as File
    const genre = formData.get('genre')
    const language = formData.get('language')
    const userEmail = formData.get('user_email')
    const userNickname = formData.get('user_nickname')
    const userIsAuthor = formData.get('user_is_author') === 'true'
    const authorEmail = formData.get('author_email')
    const authorNickname = formData.get('author_nickname')
    const publisherEnglishName = formData.get('publisher_english_name')
    const publisherKoreanName = formData.get('publisher_korean_name')
    const publisherEmail = formData.get('publisher_email')
    const priceKorean = formData.get('price_korean')
    const priceEnglish = formData.get('price_english')
    const numberOfFreeChapters = formData.get('num_free_chapters')
    const tags = JSON.stringify((formData.get('tags') as string).split(' ').map((tag: string) => tag.replace(",", "").trim()));
    const fileType = coverArt.type;
    const fileContent = Buffer.from(await coverArt.arrayBuffer());
    const availableLanguages = formData.get('available_languages') as string;
    const fileNameResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_random_filename`);
    const fileName = await fileNameResponse.json();
    const titleEnglish = formData.get('title_english')
    const okayToCreateVideos = formData.get('okay_to_create_videos') === 'true'

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
        user_email: userEmail,
        user_nickname: userNickname,
        publisher_english_name: publisherEnglishName,
        publisher_korean_name: publisherKoreanName,
        publisher_email: publisherEmail,
        num_free_chapters: numberOfFreeChapters,
        tags: tags,
        user_is_author: userIsAuthor,
        author_email: authorEmail,
        author_nickname: authorNickname,
        available_languages: availableLanguages,
        price_korean: priceKorean,
        price_english: priceEnglish,
        okay_to_create_videos: okayToCreateVideos,
        title_english: titleEnglish
    }

    console.log(send_data);

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