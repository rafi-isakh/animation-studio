import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const data = await req.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/save_other_translation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        console.error("Saving translation to DB failed");
        const errorData = await res.text();
        return NextResponse.json({ message: "Translation saved failed", error: errorData }, { status: 500 });
    } else {
        return NextResponse.json({ message: "Translation saved successfully" });
    }
}