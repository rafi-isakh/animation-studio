import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Button } from "@mui/material";
import { MdStars } from "react-icons/md";
import type { RequestPayParams, RequestPayResponse } from "@/portone";
import { useUser } from "@/contexts/UserContext";

export default function PurchaseStarsComponent() {
    const starsOptions = [10, 30, 50, 100, 300]
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

    return (
        <div className="flex flex-col w-[360px] space-y-4 items-center justify-center m-auto tall:h-[calc(100vh-16rem)]">
            <h1 className="text-2xl font-extrabold">{phrase(dictionary, "stars", language)}</h1>
            {starsOptions.map((stars, index) => (
                <Button key={index} onClick={() => onClickPayment(stars)} variant="outlined" color="gray" className="text-xl flex items-center justify-between w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <MdStars className="text-xl text-pink-500" />
                            <h1 className="text-xl">{stars.toLocaleString()}</h1>
                        </div>
                        <h1 className="text-xl">{(stars * 100).toLocaleString()}원</h1>
                    </div>
                </Button>
            ))}
        </div>
    );
}
