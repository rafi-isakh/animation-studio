"use client"
import TossPaymentComponent from "@/components/TossPaymentComponent";
import { useParams } from "next/navigation";

export default function Toss() {
    const params = useParams();
    const { stars } = params;

    return (
        <div>
            <TossPaymentComponent stars={parseInt(stars as string)} />
        </div>
    );
}