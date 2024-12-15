import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { text } = await request.json();
    const start = performance.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/detect_language`, {
        method: "POST",
        body: JSON.stringify({ text }),
    });
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to detect language" }, { status: 500 });
    }
    const data = await response.json();
    const langcode = data.langcode;
    const end = performance.now();
    console.log(`Detect language took ${end - start} milliseconds for ${text}`);
    return NextResponse.json({ langcode });
}