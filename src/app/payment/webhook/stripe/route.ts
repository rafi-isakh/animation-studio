import { NextRequest, NextResponse } from "next/server";
import { stars_name_to_price_krw, stars_name_to_price_usd, tickets_name_to_price_krw, tickets_name_to_price_usd } from "@/utils/stars";
import crypto from "crypto";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    if (!process.env.STRIPE_SECRET_KEY || !endpointSecret) {
        return NextResponse.json(
            { message: "Server configuration error" },
            { status: 500 }
        );
    }

    try {
        // Get the raw body content as text
        const body = await req.text();
        const sig = req.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json(
                { message: "Missing Stripe signature" },
                { status: 400 }
            );
        }

        // Verify the webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return NextResponse.json(
                { message: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('PaymentIntent was successful!', paymentIntent.id);

                // Extract metadata from the payment - assuming you store stars info in metadata
                const value = paymentIntent.metadata?.value ?
                    parseInt(paymentIntent.metadata.value, 10) : -1;

                if (value === -1) {
                    return NextResponse.json(
                        { message: "Payment failed: invalid amount of value." },
                        { status: 400 }
                    );
                }

                // Verify payment amount matches expected price
                if (paymentIntent.metadata.purchase_type == 'en' || paymentIntent.metadata.purchase_type == 'ko') {
                    let expectedAmount = stars_name_to_price_krw[`투니즈 별 ${value}개`] || 0;
                    if (paymentIntent.currency == 'krw') {
                        if (expectedAmount !== paymentIntent.amount) {
                            console.error("Possible forge attempt! Payment amount does not match stars.",
                                paymentIntent.receipt_email, value, paymentIntent.amount);
                            return NextResponse.json(
                                { message: "Payment failed: invalid payment amount." },
                                { status: 400 }
                            );
                        }
                    } else if (paymentIntent.currency == 'usd') {
                        expectedAmount = stars_name_to_price_usd[`투니즈 별 ${value}개`] * 100 || 0;  // Stripe amounts are in cents
                        if (expectedAmount !== paymentIntent.amount) {
                            console.error("Possible forge attempt! Payment amount does not match stars.",
                                paymentIntent.receipt_email, value, paymentIntent.amount);
                            return NextResponse.json(
                                { message: "Payment failed: invalid payment amount." },
                                { status: 400 }
                            );
                        }
                    }
                }
                else if (paymentIntent.metadata.purchase_type == 'tix') {
                    let expectedAmount = tickets_name_to_price_krw[`투니즈 티켓 ${value}개`] || 0;
                    if (paymentIntent.currency == 'krw') {
                        if (expectedAmount !== paymentIntent.amount) {
                            console.error("Possible forge attempt! Payment amount does not match tickets.",
                                paymentIntent.receipt_email, value, paymentIntent.amount);
                        }
                    } else if (paymentIntent.currency == 'usd') {
                        expectedAmount = tickets_name_to_price_usd[`투니즈 티켓 ${value}개`] * 100 || 0;  // Stripe amounts are in cents
                        if (expectedAmount !== paymentIntent.amount) {
                            console.error("Possible forge attempt! Payment amount does not match tickets.",
                                paymentIntent.receipt_email, value, paymentIntent.amount);
                        }
                    }
                }
                // Create transaction record
                const requestPayload = {
                    currency: paymentIntent.currency.toUpperCase(),
                    transaction_id: paymentIntent.id,
                    transaction_pg: 'stripe',
                    email: paymentIntent.metadata.email || '',
                    // TODO: change to 별 덤
                    purchase_type: paymentIntent.metadata.purchase_type,
                    value: value,
                    price: paymentIntent.currency == 'usd' ? paymentIntent.amount / 100 : paymentIntent.amount,
                    date: new Date().toISOString()
                };

                if (!process.env.PORTONE_ACCESS_TOKEN) {
                    throw new Error("PORTONE_ACCESS_TOKEN is not set");
                }
                if (!process.env.PORTONE_BACKEND_SECRET) {
                    throw new Error("PORTONE_BACKEND_SECRET is not set");
                }

                // Sign the request
                const timestamp = new Date().toISOString();
                const requestBody = JSON.stringify(requestPayload);
                const signature = crypto
                    .createHmac('sha256', process.env.PORTONE_BACKEND_SECRET)
                    .update(`${timestamp}:${requestBody}`)
                    .digest('hex');

                // Send transaction to backend
                const addTransactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_transaction`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Server-Secret": process.env.PORTONE_ACCESS_TOKEN,
                        "X-Timestamp": timestamp,
                        "X-Signature": signature
                    },
                    body: requestBody,
                });

                if (!addTransactionResponse.ok) {
                    console.error("Transaction failed: ", addTransactionResponse.statusText, addTransactionResponse.status);
                    const responseData = await addTransactionResponse.json();
                    console.error("Transaction response data:", JSON.stringify(responseData));
                    throw new Error(`addTransactionResponse: ${JSON.stringify(responseData)}`);
                }
                break;
            }
            case 'payment_method.attached':
                const paymentMethod = event.data.object;
                console.log('PaymentMethod was attached to a Customer!', paymentMethod.id);
                break;
            // Handle other event types as needed
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a success response
        return NextResponse.json({ received: true }, { status: 200 });
    } catch (e) {
        // Payment verification failed
        console.error(e);
        return NextResponse.json({ message: "Payment processing failed" }, { status: 500 });
    }
}