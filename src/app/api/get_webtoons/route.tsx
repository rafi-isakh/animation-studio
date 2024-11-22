import { Webtoon } from "@/components/Types";
import { WebtoonChapter } from "@/components/Types";
import { getSignedUrlForWebtoonImage } from "@/utils/s3";
import { NextResponse } from "next/server";

export async function GET() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webtoons`,
        {
            cache: "no-store"
        }
    )
    const data = await response.json()
    console.log(data)
    return NextResponse.json(data)
}