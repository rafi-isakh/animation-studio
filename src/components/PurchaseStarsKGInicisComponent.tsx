"use client"
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Alert, AlertTitle, Button, Snackbar, SnackbarCloseReason } from "@mui/material";
import { MdStars } from "react-icons/md";
import type { RequestPayParams, RequestPayResponse } from "@/portone";
import { useUser } from "@/contexts/UserContext";
import Image from 'next/image';
import { useRouter, useSearchParams } from "next/navigation";

export default function PurchaseStarsKGInicisComponent() {
    const starsOptions = [100, 300, 500, 1000]
    const starsEventOptions = [150, 350, 550, 1100]
    const discount_factors = [0.95, 0.9, 0.85, 0.8]
    const { dictionary, language } = useLanguage();
    const { email, nickname, stars } = useUser();
    const searchParams = useSearchParams();
    // true if reaching the page with this component after completion of payment
    const complete = searchParams.get('complete');
    // const { enqueueSnackbar } = useSnackbar();
    const [isOpen, setIsOpen] = useState(true);

    const handleCloseSnackbar = (
        event?: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsOpen(false);
    };

    const onClickPaymentInicis = (numStars: number, discount: number) => {
        if (!window.IMP) return;
        /* 1. 가맹점 식별하기 */
        const { IMP } = window;
        IMP.init("imp04870215"); // 가맹점 식별코드

        /* 2. 결제 데이터 정의하기 */
        const data: RequestPayParams = {
            pg: "html5_inicis", // PG사 : https://developers.portone.io/docs/ko/tip/pg-2 참고
            pay_method: "card", // 결제수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
            amount: ((numStars * 10) * discount), // 결제금액
            name: `투니즈 별 ${numStars}개`, // 주문명
            buyer_name: nickname, // 구매자 이름
            // buyer_tel: "01012341234", // 구매자 전화번호
            buyer_email: email, // 구매자 이메일
            // buyer_addr: "신사동 661-16", // 구매자 주소
            // buyer_postcode: "06018", // 구매자 우편번호
            m_redirect_url: `${process.env.NEXT_PUBLIC_HOST}/payment-redirect`,
        };

        /* 4. 결제 창 호출하기 */
        IMP.request_pay(data, callback);

        async function callback(response: RequestPayResponse) {
            const { success, error_msg } = response;
            if (success) {
                const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_HOST}/payment/complete`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        imp_uid: response.imp_uid,
                        merchant_uid: response.merchant_uid,
                        email: email,
                        stars: numStars,
                    })
                });
                if (completeResponse.ok) {
                    alert("결제 성공");
                } else {
                    alert(`결제 실패: ${completeResponse.statusText}`);
                }
            } else {
                alert(`결제 실패: ${error_msg}`);
            }
        }
    }

    return (
        <div className="relative flex flex-col md:w-[360px] w-full space-y-4 items-center justify-center m-auto">
            {/*  tall:h-[calc(100vh-16rem)]  */}
            <div className="flex flex-col w-full items-center justify-center">
                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={isOpen}
                    autoHideDuration={5000}
                    onClose={handleCloseSnackbar}
                    key="error"
                >
                    <Alert severity="error" onClose={() => setIsOpen(false)}>
                        <AlertTitle>별 구입 서비스는 테스트 중입니다. 테스트 목적으로만 구매하세요.</AlertTitle>
                    </Alert>
                </Snackbar>

                <Image src="/stelli/stelli-smile.png" alt="stars" width={100} height={100} />
                {/* <h1 className="text-red-500 font-extrabold text-center"> 주의: 투니즈는 아직 정식으로 런칭하지 않았습니다. 별을 구매하실 수 있으나, 아직 사용하실 수 없습니다.</h1> */}
                <h1 className="text-2xl font-extrabold text-center">
                    {phrase(dictionary, "stars", language)}
                </h1>
                <div className="flex flex-col w-full gap-2 pt-5">
                    {/* top padding 5 */}
                    {language === 'ko' && <p className="text-sm text-gray-500 text-left">현재 보유중인 투니즈 별 <span className="font-bold text-[#DE2B74]">{stars}</span> 개 </p>}
                    {language === 'en' && <p className="text-sm text-gray-500 text-left">You have <span className="font-bold text-[#DE2B74]">{stars}</span> stars </p>}
                </div>
            </div>

            <div className="flex flex-col w-full rounded-md p-2 bg-gradient-to-r
                            from-indigo-500/10 from-10% via-sky-500/10 via-30% to-emerald-500/10 to-90%">
                <h1 className="text-md font-base py-3 px-2 text-left">
                    {/* Regular Bundles   */}
                    {language === 'ko' ? '스페셜 딜' : 'Special Deal for You'}
                </h1>
                {starsEventOptions.map((stars, index) => (
                    <Button
                        key={index}
                        onClick={() => onClickPaymentInicis(stars, discount_factors[index])}
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
                                        {language === 'ko' ? <>별{' '}</> : ''}
                                        {stars.toLocaleString()}
                                        {language === 'ko' ? <>{' '}개</> : <span className="text-md lowercase"></span>}
                                        <span className="text-[10px] text-black dark:text-[#D92979] self-center font-bold">Save {100 - discount_factors[index] * 100}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <h1 className="text-sm rounded-lg bg-[#FFF0EE] px-3 py-1 min-w-[90px] text-center">
                                    {((stars * 10) * discount_factors[index]).toLocaleString()}원
                                    {/* { language === 'ko' &&  <>&#8361;</> } */}
                                </h1>
                            </div>
                        </div>
                    </Button>
                ))}
            </div>

            <div className="flex flex-col w-full rounded-md p-2 border-gray-400 border">
                <h1 className="text-md font-base py-3 px-2 text-left">
                    {/* Regular Bundles   */}
                    {language === 'ko' ? '일반 번들' : 'Regular Bundles'}
                </h1>
                {starsOptions.map((stars, index) => (
                    <Button
                        key={index}
                        onClick={() => onClickPaymentInicis(stars, 1)}
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
                                backgroundColor: '#FFF0EE',
                            }
                        }}
                        className="text-xl flex items-center justify-between w-full text-gray-500 ">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2 ">
                                <MdStars className="text-xl text-[#D92979]" />
                                <div className="text-xl">
                                    {language === 'ko' ? <>별{' '}</> : ''}
                                    {stars.toLocaleString()}
                                    {language === 'ko' ? <>{' '}개</> : <span className="text-md lowercase"></span>}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <h1 className="text-sm rounded-lg bg-[#FFF0EE] px-3 py-1 min-w-[90px] text-center">
                                    {(stars * 10).toLocaleString()} 원
                                    {/* { language === 'ko' &&  <>&#8361;</> } */}
                                </h1>
                            </div>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );
}