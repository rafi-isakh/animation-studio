'use client'
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { CornerDownRight, Plus } from "lucide-react";
import { Transaction } from "@/app/stars/page";
import { CircularProgress, Skeleton } from "@mui/material";

const StarsTransactionComponent = () => {
    const { dictionary, language } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [skeletonCount, setSkeletonCount] = useState(3); // Default count
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/get_transactions");
                const data = await response.json();
                setTransactions(data);
                setSkeletonCount(data.length);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setSkeletonCount(3);
            } finally {
                setIsLoading(false);
            }
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


                <ul className="flex flex-col w-full gap-2 p-5 text-base text-gray-500">
                    {isLoading ? (
                        // Skeleton loader while loading
                        Array(skeletonCount).fill(0).map((_, index) => (
                            <li
                                key={`skeleton-${index}`}
                                className="flex flex-col w-full gap-2 py-5 border-b border-gray-200 animate-pulse">
                                <div className="flex flex-row items-center gap-2">
                                    <Skeleton variant="rounded" className="w-4 h-4 bg-gray-200 rounded-full" />
                                    <Skeleton variant="rounded" className="h-4 bg-gray-200 rounded w-10" />
                                    <Skeleton variant="rounded" className="h-4 bg-gray-200 rounded w-10" />
                                </div>
                                <Skeleton variant="rounded" className="h-4 bg-gray-200 rounded w-28" />
                                <Skeleton variant="rounded" className="h-4 bg-gray-200 rounded w-28" />
                            </li>
                        ))
                    ) : (
                        transactions?.map((transaction, index) => (
                            <li key={'transaction-' + index}
                                className="flex flex-col w-full gap-1 py-5 border-b border-gray-200">
                                <div className="flex flex-row items-center gap-2">
                                    <Plus className="text-gray-500 w-4 h-4" />
                                    <p className="text-gray-500 font-bold">{transaction.stars}</p>
                                    <p className="text-gray-500 font-bold">{phrase(dictionary, "star", language)}</p>
                                </div>
                                <p className="text-gray-500">{transaction.price} {transaction.currency}</p>
                                <p className="text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div >
    )
}

export default StarsTransactionComponent;

