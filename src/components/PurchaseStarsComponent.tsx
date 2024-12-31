import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Button } from "@mui/material";
import { MdStars } from "react-icons/md";
import type { RequestPayParams, RequestPayResponse } from "@/portone";
import { useUser } from "@/contexts/UserContext";
import Image from 'next/image';

export default function PurchaseStarsComponent() {
    const starsOptions = [10, 30, 50, 100, 300, 500, 1000]
    const starsEventOptions = [15, 35, 55, 110]
    const { dictionary, language } = useLanguage();
    const { email, nickname } = useUser();

    const onClickPayment = (numStars: number) => {
        if (!window.IMP) return;
        /* 1. 가맹점 식별하기 */
        const { IMP } = window;
        IMP.init("imp04870215"); // 가맹점 식별코드

        /* 2. 결제 데이터 정의하기 */
        const data: RequestPayParams = {
            pg: "html5_inicis", // PG사 : https://developers.portone.io/docs/ko/tip/pg-2 참고
            pay_method: "card", // 결제수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
            amount: numStars * 100, // 결제금액
            name: `투니즈 별 ${numStars}개`, // 주문명
            buyer_name: nickname, // 구매자 이름
            buyer_tel: "01012341234", // 구매자 전화번호
            buyer_email: email, // 구매자 이메일
            buyer_addr: "신사동 661-16", // 구매자 주소
            buyer_postcode: "06018", // 구매자 우편번호
        };

        /* 4. 결제 창 호출하기 */
        IMP.request_pay(data, callback);

        /* 3. 콜백 함수 정의하기 */
        function callback(response: RequestPayResponse) {
            const { success, error_msg } = response;

            if (success) {
                alert("결제 성공");
            } else {
                alert(`결제 실패: ${error_msg}`);
            }
        }
    }

    const onClickPromotionPayment = (numStars: number) => {
        if (!window.IMP) return;
        /* 1. 가맹점 식별하기 */
        const { IMP } = window;
        IMP.init("imp04870215"); // 가맹점 식별코드

        /* 2. 결제 데이터 정의하기 */
        const data: RequestPayParams = {
            pg: "html5_inicis", // PG사 : https://developers.portone.io/docs/ko/tip/pg-2 참고
            pay_method: "card", // 결제수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
            amount: ((numStars * 100) * 0.9), // 결제금액
            name: `투니즈 별 ${numStars}개`, // 주문명
            buyer_name: nickname, // 구매자 이름
            buyer_tel: "01012341234", // 구매자 전화번호
            buyer_email: email, // 구매자 이메일
            buyer_addr: "신사동 661-16", // 구매자 주소
            buyer_postcode: "06018", // 구매자 우편번호
        };

        /* 4. 결제 창 호출하기 */
        IMP.request_pay(data, callback);

        /* 3. 콜백 함수 정의하기 */
        function callback(response: RequestPayResponse) {
            const { success, error_msg } = response;

            if (success) {
                alert("결제 성공");
            } else {
                alert(`결제 실패: ${error_msg}`);
            }
        }
    }

    return (
        <div className="flex flex-col w-[360px] space-y-4 items-center justify-center m-auto tall:h-[calc(100vh-16rem)]">
            <div className="flex flex-col w-full items-center justify-center">
                <Image src="/stelli/stelli-smile.png" alt="stars" width={100} height={100} />
                <h1 className="text-2xl font-extrabold text-center">
                    {phrase(dictionary, "stars", language)}
                </h1>
                <div className="flex flex-col w-full gap-2 pt-5">
                {/* top padding 5 */}
                { language === 'ko' && <p className="text-sm text-gray-500 text-left py-2 ">현재 보유중인 스타 0 개 </p> }
                { language === 'en' && <p className="text-sm text-gray-500 text-left py-2 ">You have 0 stars </p> }
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
                onClick={() => onClickPromotionPayment(stars)} 
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
                                <span className="text-[10px] text-black self-center">Save 10%</span>
                                </div>

                            </div>
                        </div>
                        <div className="flex items-center">
                          <h1 className="text-sm rounded-lg bg-[#FFF0EE] px-3 py-1 min-w-[90px] text-center">
                          {((stars * 100) * 0.9).toLocaleString()}원
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
                onClick={() => onClickPayment(stars)} 
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
                          {(stars * 100).toLocaleString()} 원
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
