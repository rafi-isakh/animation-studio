import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateOrderAmount, getStarsAndDiscount } from "@/utils/stars";
import { auth } from '@/auth';

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);


export async function POST(request: Request) {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    try {
        const { selectedPackage, isEvent } = await request.json();
        const { stars, discount } = getStarsAndDiscount(selectedPackage, isEvent);

        // Create a PaymentIntent with the order amount and currency
        // TODO: Add support for USD
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(stars, discount),
            metadata: {
                stars: stars.toString(),
                email: email
            },
            currency: "krw",
            automatic_payment_methods: {
                enabled: true,
            },
        });
        console.log(paymentIntent.client_secret);
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            // [DEV]: For demo purposes only, you should avoid exposing the PaymentIntent ID in the client-side code.
            dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
        });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: 'Error creating payment intent' },
            { status: 500 }
        );
    }
}