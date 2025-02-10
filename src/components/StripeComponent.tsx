"use client";
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

export default function StripeComponent() {
  const [confirmed, setConfirmed] = useState(false);
  const [dpmCheckerLink, setDpmCheckerLink] = useState("");
  const { language } = useLanguage();

  const { stars, discount, paymentIntentSecret, setPaymentIntentSecret } = useStripeContext();

  useEffect(() => {
    const confirmed = !!new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    setConfirmed(confirmed);
  });

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    if (!confirmed && stars > 0) {
      fetch("/api/stripe_create_payment_intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, discount }),
      })
        .then((res) => res.json())
        .then((data) => {
          setPaymentIntentSecret(data.clientSecret);
          // [DEV] For demo purposes only
          setDpmCheckerLink(data.dpmCheckerLink);
        });
    }
  }, [stars, discount]);

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
      <h1 className="text-2xl font-bold"> 별 {stars}개를 구매하시겠습니까? </h1>
      {paymentIntentSecret && (
        <Elements options={options as StripeElementsOptions} stripe={stripePromise}>
          {confirmed ? <CompletePage /> : <CheckoutForm dpmCheckerLink={dpmCheckerLink} />}
        </Elements>
      )}
    </div>
  );
}