import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { stars_name_to_price_krw } from "@/utils/stars";
import crypto from "crypto";

export async function POST(req: NextRequest, res: NextResponse) {
    const { imp_uid, merchant_uid } = await req.json();
    if (!process.env.PORTONE_API_KEY || !process.env.PORTONE_API_SECRET) {
        return NextResponse.json(
            { message: "Server configuration error" },
            { status: 500 }
        );
    }
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
            throw new Error(`paymentResponse is not ok: imp_uid: ${imp_uid}, merchant_uid: ${merchant_uid}`);
        const payment = await paymentResponse.json();
        const starsMatch = payment.response.name?.match(/\d+/);
        const stars = starsMatch ? parseInt(starsMatch[0], 10) : -1 // "투니즈 별 150개" 에서 "150" 가져오기
        if (stars === -1) {
            return NextResponse.json({ message: "Payment failed: invalid amount of stars. Check if the name of the purchased item has a number." }, { status: 400 });
        }

        if (stars_name_to_price_krw[payment.response.name] !== payment.response.amount) {
            console.error("Possible forge attempt! Payment failed: invalid payment amount.", payment.response.buyer_email, payment.response.name, payment.response.amount);
            return NextResponse.json({ message: "Payment failed: invalid payment amount." }, { status: 400 });
        }
        switch (payment.response.status) {
            case "paid": {
                // 모든 금액을 지불했습니다! 완료 시 원하는 로직을 구성하세요.
                const requestPayload = {
                    currency: "KRW",
                    transaction_id: merchant_uid,
                    transaction_pg: 'inicis',
                    email: payment.response.buyer_email,
                    stars: stars,
                    price: payment.response.amount,
                    date: new Date().toISOString()
                };

                if (!process.env.PORTONE_ACCESS_TOKEN) {
                    throw new Error("PORTONE_ACCESS_TOKEN is not set");
                }
                if (!process.env.PORTONE_BACKEND_SECRET) {
                    throw new Error("PORTONE_BACKEND_SECRET is not set");
                }

                const timestamp = new Date().toISOString();
                const requestBody = JSON.stringify(requestPayload);
                const signature = crypto
                    .createHmac('sha256', process.env.PORTONE_BACKEND_SECRET)
                    .update(`${timestamp}:${requestBody}`)
                    .digest('hex');

                const addTransactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_transaction`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Server-Secret": process.env.PORTONE_ACCESS_TOKEN,
                        "X-Timestamp": timestamp,
                        "X-Signature": signature
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
        return Response.json({ message: "Payment failed" }, { status: 500 });
    }
    return Response.json({ message: "Payment complete" }, { status: 200 });
}