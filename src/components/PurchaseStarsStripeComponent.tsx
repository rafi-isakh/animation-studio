"use client"
import { Alert, AlertTitle, Button, Snackbar, SnackbarCloseReason } from "@mui/material";

import { MdStars } from "react-icons/md";
import type { RequestPayParams, RequestPayResponse } from "@/portone";
import Image from 'next/image';
import StripeComponent from "@/components/StripeComponent";
import { useRouter } from "next/navigation";
import DictionaryPhrase from "@/components/DictionaryPhrase";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { starsOptions, starsEventOptions, discount_factors_event, discount_factors, getStarsAndDiscount, calculateOrderAmount } from "@/utils/stars";

export default function PurchaseStarsStripeComponent() {
    const router = useRouter();
    const { isLoggedIn, loading } = useAuth();
    const [selectedPackage, setSelectedPackage] = useState<string>("");
    const [isEvent, setIsEvent] = useState<boolean>(false);
    const [isPaying, setIsPaying] = useState<boolean>(false);
    const [starsToBuy, setStarsToBuy] = useState<number>(0);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    useEffect(() => {
        if (!isLoggedIn && !loading) {
            router.push("/signin");
        }
    }, [isLoggedIn, loading]);

    useEffect(() => {
        const { stars, discount } = getStarsAndDiscount(selectedPackage, isEvent);
        setStarsToBuy(stars);
        setTotalPrice(calculateOrderAmount(stars, discount));
    }, [isEvent, selectedPackage])

    const StarsToPurchase = ({ event }: { event: boolean }) => {
        const options = event ? starsEventOptions : starsOptions;
        const discount_factors_used = event ? discount_factors_event : discount_factors;
        return (
            <div className="flex flex-col w-full rounded-md p-2 bg-gradient-to-r
                            from-indigo-500/10 from-10% via-sky-500/10 via-30% to-emerald-500/10 to-90%">
                <h1 className="text-md font-base py-3 px-2 text-left">
                    {event ?
                        <DictionaryPhrase phraseVar="special_deal" /> :
                        <DictionaryPhrase phraseVar="regular_bundles" />}
                </h1>
                {options.map((stars, index) => (
                    <Button
                        key={index}
                        onClick={() => {
                            setSelectedPackage(index.toString());
                            setIsEvent(event);
                            setIsPaying(true);
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
                                        별{stars.toLocaleString()}{' '}개
                                        {event && <span className="text-[10px] text-black dark:text-[#D92979] self-center font-bold">Save {100 - discount_factors_used[index] * 100}%</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <h1 className="text-sm rounded-lg bg-[#FFF0EE] px-3 py-1 min-w-[90px] text-center">
                                    {((stars * 10) * discount_factors_used[index]).toLocaleString()}원
                                    {/* { language === 'ko' &&  <>&#8361;</> } */}
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
                        별 {starsToBuy.toLocaleString()}개를 {totalPrice.toLocaleString()}원에 구매합니다.
                    </h1>
                    <StripeComponent isEvent={isEvent} selectedPackage={selectedPackage} />
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
