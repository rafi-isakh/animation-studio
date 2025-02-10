"use client";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import CheckoutForm from "@/components/StripeCheckoutForm";
import CompletePage from "@/components/StripeCompletePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripePage() {
  const [clientSecret, setClientSecret] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [dpmCheckerLink, setDpmCheckerLink] = useState("");
  const { language } = useLanguage();

  useEffect(() => {
    const confirmed = !!new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    setConfirmed(confirmed);
    console.log(confirmed);
  });

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    if (!confirmed) {
      fetch("/api/stripe_create_payment_intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, discount }),
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
          // [DEV] For demo purposes only
          setDpmCheckerLink(data.dpmCheckerLink);
        });
    }
  }, []);

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
    locale: language,
  };

  return (
    <div className="md:max-w-screen-lg mt-32 mx-auto flex flex-col items-center justify-center">
      {clientSecret && (
        <Elements options={options as StripeElementsOptions} stripe={stripePromise}>
          {confirmed ? <CompletePage /> : <CheckoutForm dpmCheckerLink={dpmCheckerLink} />}
        </Elements>
      )}
    </div>
  );
}