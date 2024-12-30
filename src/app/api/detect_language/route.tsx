import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { text } = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/detect_language`, {
        method: "POST",
        body: JSON.stringify({ text }),
    });
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to detect language" }, { status: 500 });
    }
    const data = await response.json();
    const langcode = data.langcode;
    return NextResponse.json({ langcode });
}