import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import CheckoutForm from "@/components/StripeCheckoutForm";
import CompletePage from "@/components/StripeCompletePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";
import { useStripeContext } from "@/contexts/StripeContext";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default async function StripeComponent({ setShowStripeComponent }: { setShowStripeComponent: (show: boolean) => void }) {
    const { language } = useLanguage();

    const { stars, discount, paymentIntentSecret, setPaymentIntentSecret } = useStripeContext();


    const calculateOrderAmount = (numStars: number, discount: number) => {
        return numStars * 10 * discount;
    };

    const { client_secret: clientSecret } = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(stars, discount),
        currency: 'krw',
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
            enabled: true,
        },
    })


    const appearance = {
        theme: 'stripe',
    };
    const options = {
        clientSecret: paymentIntentSecret,
        appearance,
        locale: language,
    };

    return (
        <div className="md:max-w-screen-lg mx-auto flex flex-col items-center justify-center">
            {paymentIntentSecret && (
                <Elements options={options as StripeElementsOptions} stripe={stripePromise}>
                    <CheckoutForm clientSecret={clientSecret!} />
                </Elements>
            )}
        </div>
    );
}