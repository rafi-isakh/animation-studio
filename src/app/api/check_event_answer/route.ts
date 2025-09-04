import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
      return NextResponse.json({
          message: "Unauthorized",
      }, {
          status: 401
      });
  }
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/check_event_answer`, {
      method: "GET",
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
          'Provider': session.provider
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to check event answer" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in check_event_answer route:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
