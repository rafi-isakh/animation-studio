"use client"
import { Button } from "@mui/material"
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk"
// import { ANONYMOUS } from "@tosspayments/payment-widget-sdk"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
const customerKey = "YbX2HuSlsC9uVJW6NMRMj"

export default function TossPaymentComponent({ stars }: { stars: number }) {
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
            <h1 className="text-2xl font-extrabold">주문서</h1>
            <h2 className="text-xl font-bold">별 {stars}개 결제: {(stars * 100).toLocaleString()}원</h2>
            <div id="payment-widget" className="w-full" />
            <Button
                variant="outlined"
                color="gray"
                className="text-xl"
                onClick={async () => {
                    const paymentWidget = paymentWidgetRef.current

                    try {
                        await paymentWidget?.requestPayment({
                            orderId: nanoid(),
                            orderName: `별 ${stars}개`,
                            customerName: "김독자",
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
            </Button>
        </div>
    )
}
