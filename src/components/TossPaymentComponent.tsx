"use client"
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk"
// import { ANONYMOUS } from "@tosspayments/payment-widget-sdk"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
const customerKey = "YbX2HuSlsC9uVJW6NMRMj"

export default function TossPaymentComponent() {
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null)
    const price = 50_000

    useEffect(() => {
        (async () => {
            const paymentWidget = await loadPaymentWidget(clientKey, customerKey)

            paymentWidget.renderPaymentMethods("#payment-widget", price)

            paymentWidgetRef.current = paymentWidget
        })()
    }, [])

    return (
        <div className="mx-auto max-w-screen-md flex flex-col space-y-4 items-center justify-center">
            <h1>주문서</h1>
            <div id="payment-widget" className="w-full" />
            <button
                onClick={async () => {
                    const paymentWidget = paymentWidgetRef.current

                    try {
                        await paymentWidget?.requestPayment({
                            orderId: nanoid(),
                            orderName: "토스 티셔츠 외 2건",
                            customerName: "김토스",
                            customerEmail: "customer123@gmail.com",
                            successUrl: `${process.env.NEXT_PUBLIC_HOST}/success`,
                            failUrl: `${process.env.NEXT_PUBLIC_HOST}/fail`,
                        })
                    } catch (err) {
                        console.log(err)
                    }
                }}
            >
                결제하기
            </button>
        </div>
    )
}

