import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const imp_uid = searchParams.get('imp_uid');
    const merchant_uid = searchParams.get('merchant_uid');
    try {
        const tokenResponse = await fetch("https://api.iamport.kr/users/getToken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                imp_key: process.env.PORTONE_API_KEY, // REST API 키
                imp_secret: process.env.PORTONE_API_SECRET, // REST API Secret
            }),
        });
        if (!tokenResponse.ok)
            throw new Error(`tokenResponse: ${await tokenResponse.json()}`);
        const { response } = await tokenResponse.json();
        const { access_token } = response;
        const paymentResponse = await fetch(
            `https://api.iamport.kr/payments/${imp_uid}`,
            { headers: { Authorization: access_token } },
        );
        if (!paymentResponse.ok)
            throw new Error(`paymentResponse: ${await paymentResponse.json()}`);
        const payment = await paymentResponse.json();
        const starsMatch = payment.name?.match(/\d{1,3}(,\d{3})*|\d+/);
        const stars = starsMatch ? parseInt(starsMatch[0].replace(/,/g, ''), 10) : -1 // "투니즈 별 150개" 에서 "150" 가져오기
        if (stars === -1) {
            return NextResponse.json({ message: "Payment failed: invalid amount of stars. Check if the name of the purchased item has a number." });
        }
        switch (payment.status) {
            case "paid": {
                // 모든 금액을 지불했습니다! 완료 시 원하는 로직을 구성하세요.
                const addTransactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_transaction`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session?.accessToken}`
                    },
                    body: JSON.stringify({ currency: "KRW", email: session?.user?.email, stars: stars, price: payment.amount, date: new Date().toISOString() }),
                });
                const data = await addTransactionResponse.json();
                break;
            }
        }
    } catch (e) {
        // 결제 검증에 실패했습니다.
        console.error(e);
        return Response.json({ message: "Payment failed" });
    }
    return Response.json({ message: "Payment complete" });
}