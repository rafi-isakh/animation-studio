import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
    const { imp_uid, merchant_uid } = await req.json();
    try {
        // get portone token
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

        // get payment corresponding to the imp_uid
        const paymentResponse = await fetch(
            `https://api.iamport.kr/payments/${imp_uid}`,
            { headers: { Authorization: access_token } },
        );
        if (!paymentResponse.ok)
            throw new Error(`paymentResponse: ${await paymentResponse.json()}`);
        const payment = await paymentResponse.json();
        const starsOrTixMatch = payment.response.name?.match(/\d+/);
        const starsOrTix = starsOrTixMatch ? parseInt(starsOrTixMatch[0], 10) : -1 // "투니즈 별 150개" 에서 "150" 가져오기
        if (starsOrTix === -1) {
            return NextResponse.json({ message: "Payment failed: invalid amount of stars. Check if the name of the purchased item has a number." }, { status: 400 });
        }
        switch (payment.response.status) {
            case "paid": {
                return NextResponse.json({ message: "Payment verified" });
            }
            default: {
                return NextResponse.json({ message: "Payment not completed" }, { status: 400 });
            }
        }
    } catch (e) {
        // 결제 검증에 실패했습니다.
        console.error(e);
        return Response.json({ message: "Payment failed" }, { status: 500 });
    }
}