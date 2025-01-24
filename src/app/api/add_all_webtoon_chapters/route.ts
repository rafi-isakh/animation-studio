import { auth } from "@/auth"
import { Webtoon } from "@/components/Types";
import { listObjectsInWebtoonsDirectory } from "@/utils/s3";
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "Unauthenticated" }, { status: 401 })
    }
    if (!session.user.email?.endsWith("stelland.io")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const webtoons = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webtoons`)
    const webtoonsData = await webtoons.json()
    const chapters = []

    for (const webtoon of webtoonsData) {
        const asWebtoon = webtoon as Webtoon
        let episodes = await listObjectsInWebtoonsDirectory(`${asWebtoon.root_directory}`)
        episodes = Array.from(new Set(episodes.filter(episode => !isNaN(Number(episode!.split("/")[1]))).map(episode => episode!.split("/")[1])))
        console.log(episodes)
        console.log("episodes length", episodes.length)
        for (let i = asWebtoon.num_free_chapters; i < episodes.length; i++) {
            const chapter = {
                    episode_number: i,
                    directory: i.toString().padStart(3, '0'),
                    webtoon_title: webtoon.title,
                    title: "Episode " + i,
                    free: false
            }
            chapters.push(chapter)
        }
    }

    for (const chapter of chapters) {
        console.log("adding chapter", chapter.episode_number)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_chapter_to_webtoon_admin`, {
            method: 'POST',
            body: JSON.stringify(chapter),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
                'Provider': session.provider
            },
        })
        const data = await response.json()
        if (!response.ok) {
            return NextResponse.json({ message: "Adding a chapter to a webtoon failed" }, { status: 500 })
        }
    }
    return NextResponse.json({ message: "Adding all chapters to webtoons success" })
}
