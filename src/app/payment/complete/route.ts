import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.log('session', session);
    const { imp_uid, email, merchant_uid } = await req.json();
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
        console.log('payment', payment);
        const starsMatch = payment.response.name?.match(/\d+/);
        const stars = starsMatch ? parseInt(starsMatch[0], 10) : -1 // "투니즈 별 150개" 에서 "150" 가져오기
        if (stars === -1) {
            return NextResponse.json({ message: "Payment failed: invalid amount of stars. Check if the name of the purchased item has a number." }, { status: 400 });
        }
        switch (payment.response.status) {
            case "paid": {
                // 모든 금액을 지불했습니다! 완료 시 원하는 로직을 구성하세요.
                const requestPayload = { 
                    currency: "KRW", 
                    transaction_id: merchant_uid, 
                    transaction_pg: 'inicis', 
                    email: session?.user?.email, 
                    stars: stars, 
                    price: payment.response.amount, 
                    date: new Date().toISOString() 
                };
                
                const addTransactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_transaction`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.accessToken}`,
                        "Provider": session.provider
                    },
                    body: JSON.stringify(requestPayload),
                });
                
                if (!addTransactionResponse.ok) {
                    console.error("Transaction failed: ", addTransactionResponse.statusText, addTransactionResponse.status);
                    const responseData = await addTransactionResponse.json();
                    console.error("Transaction response data:", JSON.stringify(responseData));
                    throw new Error(`addTransactionResponse: ${JSON.stringify(responseData)}`);
                }
                break;
            }
        }
    } catch (e) {
        // 결제 검증에 실패했습니다.
        console.error(e);
        return Response.json({ message: "Payment failed" }, { status: 400 });
    }
    return Response.json({ message: "Payment complete" }, { status: 200 });
}