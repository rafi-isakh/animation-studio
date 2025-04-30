"use client"
import { Alert, AlertTitle, Button, Snackbar, SnackbarCloseReason } from "@mui/material";

import { MdStars } from "react-icons/md";
import Image from 'next/image';
import StripeComponent from "@/components/StripeComponent";
import { useRouter } from "next/navigation";
import DictionaryPhrase from "@/components/DictionaryPhrase";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { starsOptionsUSD, calculateOrderAmount, starsString, starsPriceWithCurrencyString, nominalDiscountFactorsUSD } from "@/utils/stars";
import { useLanguage } from "@/contexts/LanguageContext";
export default function PurchaseStarsStripeComponent() {
    const router = useRouter();
    const { isLoggedIn, loading } = useAuth();
    const [selectedPackage, setSelectedPackage] = useState<string>("");
    const [isPaying, setIsPaying] = useState<boolean>(false);
    const [starsToBuy, setStarsToBuy] = useState<number>(0);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const { language } = useLanguage();

    useEffect(() => {
        if (!isLoggedIn && !loading) {
            router.push("/signin");
        }
    }, [isLoggedIn, loading]);

    useEffect(() => {
        setStarsToBuy(starsOptionsUSD[parseInt(selectedPackage)]);
        setTotalPrice(calculateOrderAmount(starsOptionsUSD[parseInt(selectedPackage)], language));
    }, [selectedPackage])

    const StarsToPurchase = ({ event }: { event: boolean }) => {
        return (
            <div className="flex flex-col w-full rounded-md p-2 bg-gradient-to-r
                            from-indigo-500/10 from-10% via-sky-500/10 via-30% to-emerald-500/10 to-90%">
                <h1 className="text-md font-base py-3 px-2 text-left">
                    <DictionaryPhrase phraseVar="regular_bundles" />
                </h1>
                {starsOptionsUSD.map((stars, index) => (
                    <Button
                        key={index}
                        onClick={() => {
                            setSelectedPackage(index.toString());
                            //TODO: TEMPORARILY DISABLED
                            //setIsPaying(true);
                        }}
                        variant="text"
                        sx={{
                            borderBottom: 1,
                            '&:last-child': {
                                borderBottom: 0
                            },
                            borderColor: '#9ca3af',
                            borderRadius: 0,
                            padding: '15px 10px',
                            margin: 0,
                            color: '#9ca3af ',
                            '&:hover': {
                                backgroundColor: 'transparent',
                            }
                        }}
                        className="text-xl flex items-center justify-between w-full text-gray-500 ">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col  ">

                                <div className="flex flex-row items-center justify-center space-x-2">
                                    <MdStars className="text-xl text-[#D92979]" />
                                    <div className="text-xl flex flex-row items-center justify-center space-x-2 gap-2">
                                        {starsString(stars, language)}
                                        {event && <span className="text-[10px] text-black dark:text-[#D92979] self-center font-bold">Save {nominalDiscountFactorsUSD[index]}%</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <h1 className="text-sm rounded-lg bg-[#FFF0EE] px-3 py-1 min-w-[90px] text-center">
                                    {starsPriceWithCurrencyString(stars, language)}
                                </h1>
                            </div>
                        </div>
                    </Button>
                ))}
            </div>
        )
    }

    return (
        <div className="relative flex flex-col max-w-screen-md w-full space-y-4 items-center justify-center m-auto">
            {/*  tall:h-[calc(100vh-16rem)]  */}
            <div className="flex flex-col w-full items-center justify-center">
                <Image src="/stelli/stelli-smile.png" alt="stars" width={100} height={100} />
                {/* <h1 className="text-red-500 font-extrabold text-center"> 주의: 투니즈는 아직 정식으로 런칭하지 않았습니다. 별을 구매하실 수 있으나, 아직 사용하실 수 없습니다.</h1> */}
                <h1 className="text-2xl font-extrabold text-center">
                    <DictionaryPhrase phraseVar="stars" />
                </h1>
            </div>

            {isPaying ? (
                <div className='self-center md:w-[720px] w-full'>
                    <h1 className="text-xl font-bold text-center">
                        {language === "en" ?
                            `Purchase ${starsToBuy.toLocaleString()} stars for $${(totalPrice / 100).toLocaleString()}.` :
                            `투니즈 별 ${starsToBuy.toLocaleString()}개를 ${totalPrice.toLocaleString()}원에 구매합니다.`}
                    </h1>
                    <StripeComponent selectedPackage={selectedPackage} />
                </div>
            ) : (
                <div className="flex flex-col md:w-[360px] w-full gap-2 pt-5">
                    <StarsToPurchase event={true} />
                    <StarsToPurchase event={false} />
                </div>
            )}
        </div>
    )
}
