import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export async function POST(request: NextRequest) {
    const { stars, discount, locale } = await request.json();
    const auth_session = await auth();
    if (!auth_session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let priceId = "";
    let currency = "";
    if (locale == "ko") {
        currency = "krw";
        switch (stars) {
            case 100:
                priceId = "price_1QwbCvAl7jkSENR1IpegNIIc";
                break;
            case 300:
                priceId = "price_1QwbGTAl7jkSENR1jn7B4V0j";
                break;
            case 500:
                priceId = "price_1QwbGlAl7jkSENR16WfGNXGD";
                break;
            case 1000:
                priceId = "price_1QwbH7Al7jkSENR1XYbccTin";
                break;
            case 3000:
                priceId = "price_1QwbHNAl7jkSENR1RchndOqB";
                break;
            case 5000:
                priceId = "price_1QwbIXAl7jkSENR17BZszVAq";
                break;
            default:
                console.error(`Invalid stars: user ${auth_session.user.email} with locale ${locale} attempted to purchase ${stars} stars`);
                return NextResponse.json({ error: "Invalid stars" }, { status: 400 });
        }
    } else if (locale == "en") {
        currency = "usd";
        switch (stars) {
            case 100:
                priceId = "price_1QwbRmAl7jkSENR181l5crXz";
                break;
            case 300:
                priceId = "price_1QwbPbAl7jkSENR11DWOSyJZ";
                break;
            case 500:
                priceId = "price_1QwbPmAl7jkSENR1IZJ4jAqp";
                break;
            case 1000:
                priceId = "price_1QwbPyAl7jkSENR1C94pFmcK";
                break;
            case 3000:
                priceId = "price_1QwbQAAl7jkSENR1KL5KTLos";
                break;
            case 5000:
                priceId = "price_1QwbQUAl7jkSENR1Ptuifcn6";
                break;
            default:
                console.error(`Invalid stars: user ${auth_session.user.email} with locale ${locale} attempted to purchase ${stars} stars`);
                return NextResponse.json({ error: "Invalid stars" }, { status: 400 });
        }
    }
    try {
        const session = await stripe.checkout.sessions.create({
            ui_mode: "embedded",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            payment_method_configuration: "pmc_1QwYLCAl7jkSENR16FbH2u3t",
            mode: "payment",
            locale: locale,
            currency: currency,
            return_url: `${request.headers.get(
                "origin"
            )}/payment-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        });
        return NextResponse.json({
            id: session.id,
            client_secret: session.client_secret,
        });
    } catch (err) {
        console.log(err);
        return Response.json(err, {
            status: 400,
        });
    }
}
