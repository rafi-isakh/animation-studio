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
        <div className="flex flex-col md:w-[360px] w-full space-y-4 items-center justify-center m-auto tall:h-[calc(100vh-16rem)]">
            <div className="flex flex-col w-full items-center justify-center">
                <Image src="/stelli/stelli-smile.png" alt="stars" width={100} height={100} />
                <h1 className="text-2xl font-extrabold text-center">
                    {phrase(dictionary, "stars", language)}
                </h1>
                <div className="flex flex-col w-full gap-2 pt-5">
                {/* top padding 5 */}
                { language === 'ko' && <p className="text-sm text-gray-500 text-left">현재 보유중인 투니즈 별 <span className="font-bold text-[#DE2B74]">1000</span> 개 </p> }
                { language === 'en' && <p className="text-sm text-gray-500 text-left">You have <span className="font-bold text-[#DE2B74]">1000</span> stars </p> }
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

            <div className="text-[10px] text-left py-2 px-2 rounded-md text-black">
            
            <p> 취소 환불 규정 </p> 
            <br/> 
            - 구글, 애플 인앱결제로 결제한 포인트의 결제 취소는 구글플레이 고객센터, 애플 고객지원에 문의하여 진행 가능합니다. <br/>
            - 간편결제, 일반결제(신용카드 등)를 통해 충전한 포인트의 전액 결제 취소는 취소를 희망하는 포인트의 사용 이력이 없고, 결제 완료일로부터 7일 안에 취소한 경우에 가능합니다. <br/>
            - 결제 취소는 dami@stelland.io를 통해 신청할 수 있으며, 결제사 정책에 따라 카드 승인 취소 또는 대금이 고객님의 계좌로 입금되기까지 영업일 기준으로 최대 5일이 소요될 수 있습니다. <br/>
            - 이용약관에 따라 500원 또는 잔액의 10% 중 큰 금액을 환급 수수료로 제외하고 환불해 드립니다. 단, 잔액이 500원 이하인 경우 환불이 불가합니다. <br/>
            - 환불 신청은 이메일 dami@stelland.io로 통해서 진행할 수 있습니다. <br/>
            - 환불 신청 이후 환불 조건을 충족했을 경우, 환불된 금액은 영업일 기준으로 5일 안에 환불 계좌로 입금해드립니다. <br/>
            - 환불 신청 이후 포인트를 사용하면 환불이 불가할 수 있습니다. <br/>
            - 미성년자는 포인트를 충전하기 전에 부모 등 법정 대리인의 동의를 받아야 합니다. 법정대리인이 동의하지 않은 경우 미성년자 본인 또는 법정대리인이 이용 계약을 취소할 수 있습니다. <br/>
            <br/>
            <p> 민원 규정 </p> 
            <span> Stella& Inc. </span> 에서 운영하는 사이트에서 판매되는 모든 상품은 <span> Stella& Inc.</span> 에서 책임지고 있습니다.  <br/> 
                  * 민원 담당자 플랫폼 운영실 강다미 / 연락처 02-6952-7933

            
            </div>

        </div>
    );
}
