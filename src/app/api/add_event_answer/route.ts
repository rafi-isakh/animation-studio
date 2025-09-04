import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_event_answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
        "Provider": session.provider
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json({ error: errData.message || "Failed to submit answers" }, { status: res.status });
    }

    const responseData = await res.json();
    return NextResponse.json(responseData);

  } catch (err) {
    console.error("Error in add_event_answer route:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
