'use client'
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { CornerDownRight, Plus } from "lucide-react";
import { Transaction } from "@/app/stars/page";

const StarsTransactionComponent = () => {
    const { dictionary, language } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    useEffect(() => {
        const fetchTransactions = async () => {
            const response = await fetch("/api/get_transactions");
            const data = await response.json();
            setTransactions(data);
        };
        fetchTransactions();
    }, []);

    return (

        <div className="flex flex-col md:max-w-screen-md w-full mx-auto">
            <div className="flex flex-col w-full gap-2">
                <h1 className="text-2xl font-extrabold text-center">
                    {/* 충전 내역 */}
                    {phrase(dictionary, "starsTransaction", language)}
                </h1>

                <div className="flex flex-col w-full gap-2 p-5 text-base text-gray-500">
                    {transactions?.map((transaction, index) => (
                        <div className="flex flex-row space-x-4 justify-between items-center">
                            <div key={index} className="flex flex-row items-center">
                                <Plus className="text-gray-500 w-4 h-4" />
                                <p>{transaction.stars}</p>
                                <p>{phrase(dictionary, "star", language)}</p>
                            </div>
                            <p>{transaction.price} {transaction.currency}</p>
                            <p>{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    )
}

export default StarsTransactionComponent;

