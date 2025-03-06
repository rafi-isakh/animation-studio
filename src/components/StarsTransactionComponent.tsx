'use client'
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { CornerDownRight, Minus, Plus } from "lucide-react";
import { Transaction, StarUse } from "@/app/stars/page";
import CustomSkeleton from "@/components/UI/CustomSkeleton";
import { CircularProgress, Skeleton } from "@mui/material";
import { useTheme } from "@/contexts/providers";
import { useUser } from "@/contexts/UserContext";

const StarsTransactionComponent = () => {
    const { dictionary, language } = useLanguage();
    const [totalHistory, setTotalHistory] = useState<(Transaction | StarUse)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useTheme();
    const { stars } = useUser();
    const skeletonCount = 3;
    useEffect(() => {
        const fetchTotalHistory = async () => {
            let _starUseHistory: StarUse[] = [];
            let _transactions: Transaction[] = [];
            const fetchStarUse = async () => {
                try {
                    const response = await fetch("/api/get_star_use_history");
                    const data = await response.json();
                    _starUseHistory = data;
                } catch (error) {
                    console.error("Error fetching star use:", error);
                }
            }
            const fetchTransactions = async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch("/api/get_transactions");
                    const data = await response.json();
                    _transactions = data;
                } catch (error) {
                    console.error("Error fetching transactions:", error);
                } 
            };
            await fetchTransactions();
            await fetchStarUse();
            const totalHistory = [..._transactions, ..._starUseHistory];
            totalHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTotalHistory(totalHistory);
            setIsLoading(false);
        }
        fetchTotalHistory();
    }, []);

    return (

        <div className="flex flex-col md:max-w-screen-md w-full mx-auto">
            <div className="flex flex-col w-full gap-2">
                <h1 className="text-2xl font-extrabold text-center">
                    {/* 충전 내역 */}
                    {phrase(dictionary, "starsTransaction", language)}
                </h1>
                <div className="flex flex-col mx-auto justify-center items-center w-full gap-2 pt-5">
                    {/* top padding 5 */}
                    {language === 'ko' && <p className="text-sm text-gray-500">현재 보유중인 투니즈 별 <span className="font-bold text-[#DE2B74]">{stars}</span> 개 </p>}
                    {language === 'en' && <p className="text-sm text-gray-500">You have <span className="font-bold text-[#DE2B74]">{stars}</span> stars </p>}
                </div>
                <ul className="flex flex-col w-full gap-2 p-5 text-base text-gray-500">
                    {isLoading ? (
                        // Skeleton loader while loading
                        Array(skeletonCount).fill(0).map((_, index) => (
                            <li
                                key={`skeleton-${index}`}
                                className="flex flex-col w-full gap-2 py-5 border-b border-gray-200 animate-pulse">
                                <div className="flex flex-row items-center gap-2">
                                    <CustomSkeleton width={30} height={20} animation="wave" variant="rounded" className="bg-gray-200 rounded-full" />
                                    <CustomSkeleton width={40} height={20} animation="wave" variant="rounded" className="bg-gray-200 rounded" />
                                    <CustomSkeleton width={60} height={20} animation="wave" variant="rounded" className="bg-gray-200 rounded" />
                                </div>
                                <CustomSkeleton width={100} height={20} animation="wave" variant="rounded" className="bg-gray-200 rounded" />
                                {/* <CustomSkeleton width={70} height={20} animation="wave" variant="rounded" className="bg-gray-200 rounded" /> */}
                            </li>
                        ))
                    ) : (
                        totalHistory.length === 0 ? (
                            <li className="flex flex-col w-full gap-1 py-5 text-center">
                                <p className="text-gray-500">{phrase(dictionary, "noTransactions", language)}</p>
                            </li>
                        ) : (
                        totalHistory?.map((element, index) => (
                            <li key={'transaction-' + index}
                                className="flex flex-col w-full gap-1 py-5 border-b border-gray-200">
                                {'price' in element ?
                                    <div className="flex flex-row items-center gap-1">
                                        <Plus className="text-gray-500 w-4 h-4" />
                                        <p className="text-gray-500 font-bold">{element.stars}</p>
                                        <p className="text-gray-500 font-bold">{phrase(dictionary, "star", language)}</p>
                                        {'price' in element && <p className="text-gray-500">{(element as Transaction).price} {(element as Transaction).currency}</p>}
                                    </div>
                                    :
                                    <div className="flex flex-row items-center gap-2">
                                        <Minus className="text-gray-500 w-4 h-4" />
                                        <p className="text-gray-500 font-bold">{element.stars}</p>
                                        <p className="text-gray-500 font-bold">{phrase(dictionary, "star", language)}</p>
                                    </div>
                                }
                                <p className="text-gray-500">{new Date(element.date).toLocaleDateString()}</p>
                            </li>
                        ))
                    ))}
                    
                </ul>
            </div>
        </div >
    )
}

export default StarsTransactionComponent;

