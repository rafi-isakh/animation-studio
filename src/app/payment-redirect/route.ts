import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    const { searchParams } = new URL(req.url);
    const imp_uid = searchParams.get('imp_uid');
    const merchant_uid = searchParams.get('merchant_uid');
    const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_HOST}/payment/complete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({
            imp_uid: imp_uid,
            merchant_uid: merchant_uid,
        })
    });
    if (!completeResponse.ok) {
        console.error("Payment failed: ", completeResponse.statusText, completeResponse.status);
    }
    redirect(`${process.env.NEXT_PUBLIC_HOST}/stars`);
}