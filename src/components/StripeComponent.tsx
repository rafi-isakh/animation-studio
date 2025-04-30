"use client"
import CheckoutForm from "@/components/StripeCheckoutForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

export default function StripeComponent({ selectedPackage }: { selectedPackage: string }) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const { language } = useLanguage();

    useEffect(() => {
        const fetchClientSecret = async () => {
            const response = await fetch("/api/stripe_create_payment_intent", {
                method: "POST",
                body: JSON.stringify({ selectedPackage, language }),
            });
            const data = await response.json();
            setClientSecret(data.clientSecret);
        };
        fetchClientSecret();
    }, [selectedPackage]);

    return (
        <div className="md:max-w-screen-lg mx-auto flex flex-col items-center justify-center">
            {clientSecret && <CheckoutForm key={clientSecret} clientSecret={clientSecret} />}
        </div>
    );
}