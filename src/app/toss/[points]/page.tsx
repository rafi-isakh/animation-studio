"use client"
import TossPaymentComponent from "@/components/TossPaymentComponent";
import { useParams } from "next/navigation";

export default function Toss() {
    const params = useParams();
    const { points } = params;

    return (
        <div>
            <TossPaymentComponent points={parseInt(points as string)} />
        </div>
    );
}