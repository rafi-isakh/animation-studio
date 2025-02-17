import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "Unauthenticated" }, { status: 401 })
    }
    if (!session.user.email?.endsWith("stelland.io")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const formData = await req.formData()
    const max_episodes = Number(formData.get('max_episodes'))
    const title = formData.get('title')
    const chapters = []
    for (let i = 1; i < max_episodes + 1; i++) {
        const chapter = {
            episode_number: i,
            directory: i.toString().padStart(3, '0'),
            webtoon_title: title,
            title: "Episode " + i,
        }
        chapters.push(chapter)
    }

    const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_webtoon_chapters_admin`, {
        method: 'POST',
        body: JSON.stringify({
            title: title
        }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
    })
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
            return NextResponse.json({ message: "Modify webtoon failed" }, { status: 500 })
        }
    }
    return NextResponse.json({ message: "Modify webtoon success" })
}