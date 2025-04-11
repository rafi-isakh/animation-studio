"use client";

import styles from "@/styles/stripe.module.css";
import { useEffect, useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
    Elements
} from '@stripe/react-stripe-js'
import { Stripe, StripeElementsOptions, StripePaymentElementOptions } from '@stripe/stripe-js'
import { getStripe } from "@/utils/stars";
import { useLanguage } from "@/contexts/LanguageContext";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.

function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();


    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Make sure to change this to your payment completion page
                return_url: `${process.env.NEXT_PUBLIC_HOST}/stars/transactions`,
            },
        });

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "Unspecified error");
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    const paymentElementOptions = {
        layout: "auto",

    };

    return (
        <form id="payment-form" className={styles.stripeForm} onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" options={paymentElementOptions as StripePaymentElementOptions} />
            <button disabled={isLoading || !stripe || !elements} id="submit" className={styles.stripeButton}>
                <span id="button-text">
                    {isLoading ? <div className={styles.spinner} id="spinner"></div> : "Pay now"}
                </span>
            </button>
            {/* Show any error or success messages */}
            {message && <div id="payment-message" className={styles.paymentMessage}>{message}</div>}
        </form>
    );
}

export default function CheckoutForm({ clientSecret }: { clientSecret: string }) {
    const appearance = {
        theme: 'stripe',
    };
    const [stripePromise, setStripePromise] = useState<Stripe | null>(null);
    const { language } = useLanguage();

    useEffect(() => {
      getStripe(language).then((stripe) => {
        setStripePromise(stripe);
      });
    }, [language]);

    if (!stripePromise) return null;
    console.log(stripePromise);

    return (
        <Elements stripe={stripePromise} options={{ appearance, clientSecret } as StripeElementsOptions}>
            <PaymentForm />
        </Elements>
    )
}