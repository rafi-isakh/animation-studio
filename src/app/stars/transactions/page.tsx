import StarsTransactionComponent from "@/components/StarsTransactionComponent";
import Link from "next/link";
export default function StarsTransactions() {
    return <div className="flex flex-col justify-center items-center md:max-w-screen-lg w-full mx-auto">
        <StarsTransactionComponent />
    </div>
}