export const maxDuration = 300;
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
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_webtoon_chapters_admin`, {
            method: 'POST',
            body: JSON.stringify({
                title: webtoon.title
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
                'Provider': session.provider
            },
        })
        if (!deleteResponse.ok) {
            return NextResponse.json({ message: "Delete webtoon chapters failed" }, { status: 500 })
        } else {
            console.log("Delete webtoon chapters success")
        }
        let episodes = await listObjectsInWebtoonsDirectory(`${asWebtoon.root_directory}`)
        episodes = Array.from(new Set(episodes.filter(episode => !isNaN(Number(episode!.split("/")[1]))).map(episode => episode!.split("/")[1])))
        console.log("webtoon title", webtoon.title)
        console.log("episodes length", episodes.length)
        console.log("episodes", episodes)
        for (let i = 1; i < episodes.length + 1; i++) {
            const chapter = {
                episode_number: i,
                directory: i.toString().padStart(3, '0'),
                webtoon_title: webtoon.title,
                title: "Episode " + i,
                free: i <= asWebtoon.num_free_chapters
            }
            chapters.push(chapter)
        }
    }



    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_chapters_to_webtoon_admin`, {
        method: 'POST',
        body: JSON.stringify(chapters),
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
    return NextResponse.json({ message: "Adding all chapters to webtoons success" })
}
