"use client"
import { useLanguage } from "@/contexts/LanguageContext"
import PurchaseStarsStripeComponent from "./PurchaseStarsStripeComponent"
import PurchaseStarsKGInicisComponent from "./PurchaseStarsKGInicisComponent"

export default function PurchaseStarsComponent() {
    const {language} = useLanguage()

    return (
        <div>
            {language === "en" ? <PurchaseStarsStripeComponent /> : <PurchaseStarsKGInicisComponent />}
        </div>
    )
}