import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized", status: 401 });
    }
    const email = session.user.email;
    const provider = session.provider;

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/check_user?email=${email}&provider=${provider}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", status: 500 });
    }
}