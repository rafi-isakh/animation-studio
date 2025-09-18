// app/api/generate_character/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_character_gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend error: ${res.status}` },
        { status: res.status }
      );
    }

    // ✅ backend now returns JSON { "image": base64string }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in proxy route:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
