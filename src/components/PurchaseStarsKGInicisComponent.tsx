"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Button } from "@mui/material";
import { MdStars } from "react-icons/md";
import { BsFillTicketPerforatedFill } from "react-icons/bs";
import type { RequestPayParams, RequestPayResponse } from "@/portone";
import { useUser } from "@/contexts/UserContext";
import Image from 'next/image';
import { starsOptions, starsString, starsPriceWithCurrencyString, stars_name_to_price_krw, stars_name_to_free_stars_krw, ticketsOptions, ticketsString, ticketsPriceWithCurrencyString, tickets_name_to_price_krw } from "@/utils/stars";

export default function PurchaseStarsKGInicisComponent() {
    const { dictionary, language } = useLanguage();
    const { email, nickname, stars } = useUser();

    const onClickStarsPaymentInicis = (numStars: number) => {
        if (!window.IMP) return;
        /* 1. 가맹점 식별하기 */
        const { IMP } = window;
        IMP.init("imp04870215"); // 가맹점 식별코드

        /* 2. 결제 데이터 정의하기 */
        const name = `투니즈 별 ${numStars}개` // 주문명
        const data: RequestPayParams = {
            pg: "html5_inicis", // PG사 : https://developers.portone.io/docs/ko/tip/pg-2 참고
            pay_method: "card", // 결제수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
            channelKey: "channel-key-c163cb6f-3aeb-4e10-ab21-6b88d99e0ed5",
            amount: stars_name_to_price_krw[name], // 결제금액
            name: name, // 주문명
            buyer_name: nickname, // 구매자 이름
            // buyer_tel: "01012341234", // 구매자 전화번호
            buyer_email: email, // 구매자 이메일
            // buyer_addr: "신사동 661-16", // 구매자 주소
            // buyer_postcode: "06018", // 구매자 우편번호
            m_redirect_url: `${process.env.NEXT_PUBLIC_HOST}/payment-redirect`,
            display: {
                card_quota: [0]
            }
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


    const onClickTicketsPaymentInicis = (numTickets: number) => {
        if (!window.IMP) return;
        /* 1. 가맹점 식별하기 */
        const { IMP } = window;
        IMP.init("imp04870215"); // 가맹점 식별코드

        /* 2. 결제 데이터 정의하기 */
        const name = `투니즈 티켓 ${numTickets}장` // 주문명
        const data: RequestPayParams = {
            pg: "html5_inicis", // PG사 : https://developers.portone.io/docs/ko/tip/pg-2 참고
            pay_method: "card", // 결제수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
            channelKey: "channel-key-c163cb6f-3aeb-4e10-ab21-6b88d99e0ed5",
            amount: tickets_name_to_price_krw[name], // 결제금액
            name: name, // 주문명
            buyer_name: nickname, // 구매자 이름
            // buyer_tel: "01012341234", // 구매자 전화번호
            buyer_email: email, // 구매자 이메일
            // buyer_addr: "신사동 661-16", // 구매자 주소
            // buyer_postcode: "06018", // 구매자 우편번호
            m_redirect_url: `${process.env.NEXT_PUBLIC_HOST}/payment-redirect`,
            display: {
                card_quota: [0]
            }
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
                        stars: numTickets,
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

                {starsOptions.map((stars, index) => (
                    <Button
                        key={index}
                        onClick={() => onClickStarsPaymentInicis(stars)}
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
                                    {starsString(stars, language)} <span className="text-pink-500">+ 덤 {stars_name_to_free_stars_krw[`투니즈 별 ${stars}개`]}개</span>
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
            <div className="flex flex-col w-full rounded-md p-2 bg-gradient-to-r
                            from-indigo-500/10 from-10% via-sky-500/10 via-30% to-emerald-500/10 to-90%">
                <h1 className="text-md font-base py-3 px-2 text-left">
                    {/* Regular Bundles   */}
                    {language === 'ko' ? '티켓 딜' : 'Ticket Deal for You'}
                </h1>

                {ticketsOptions.map((tickets, index) => (
                    <Button
                        key={index}
                        onClick={() => onClickTicketsPaymentInicis(tickets)}
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
                                <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" />
                                <div className="text-xl">
                                    {ticketsString(tickets, language)}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <h1 className="text-sm rounded-lg bg-[#FFF0EE] px-3 py-1 min-w-[90px] text-center">
                                    {ticketsPriceWithCurrencyString(tickets, language)}
                                </h1>
                            </div>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );
}