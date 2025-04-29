import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { stars, price, date, currency } = await req.json();
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const email = session.user.email;
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_transaction`, {
        method: "POST",
        // TODO: change to 별 덤
        body: JSON.stringify({ currency, email, stars, price, date: date}),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            "Provider": session.provider
        },
    });
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to add transaction" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}
