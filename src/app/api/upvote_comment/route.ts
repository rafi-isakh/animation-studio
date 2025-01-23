import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }
    const id = searchParams.get("id")
    const undo = searchParams.get("undo")

    if (!id) {
        return NextResponse.json({
            message: "Id is required",
        }, {
            status: 400
        });
    }

    let url;
    if (undo) {
        url = `${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_comment?comment_id=${id}&undo=${undo}`
    } else {
        url = `${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_comment?comment_id=${id}`
    }
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    })
    if (!response.ok) {
        return NextResponse.json({
            message: "Failed to upvote comment",
        }, {
            status: response.status
        });
    }

    const data = await response.json();
    return NextResponse.json({
        message: "Upvote comment success",
        data: data
    });
}