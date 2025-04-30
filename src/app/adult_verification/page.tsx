"use client"
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "@/contexts/UserContext";

export default function AdultVerificationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setIsAdult } = useUser();
    const webnovel_id = searchParams.get('webnovel_id') as string;

    useEffect(() => {
        if (!window.IMP) return;
        /* 1. 가맹점 식별하기 */
        const { IMP } = window;
        IMP.init("imp04870215"); // 가맹점 식별코드

        // @ts-ignore
        IMP.certification(
            {
                // param
                channelKey: "channel-key-40f1455b-2c0b-4379-a134-c91a2e76e340",
                merchant_uid: uuidv4(), // 주문 번호
                m_redirect_url: `${process.env.NEXT_PUBLIC_HOST}/adult_verification/redirect?webnovel_id=${webnovel_id}`, // 모바일환경에서 popup:false(기본값) 인 경우 필수, 예: https://www.myservice.com/payments/complete/mobile
                popup: false, // PC환경에서는 popup 파라미터가 무시되고 항상 true 로 적용됨
            },
            function (rsp: any) {
                // callback
                if (rsp.success) {
                    // 인증 성공 시 로직
                    alert("인증 성공");
                    fetch("/api/verify_as_adult", {
                        method: "POST",
                        body: JSON.stringify({
                            imp_uid: rsp.imp_uid,
                        }),
                    }).then(response => {
                        if (response.ok) {
                            setIsAdult(true);
                            router.push(`/view_webnovels/${webnovel_id}`);
                        } else {
                            alert("업데이트 실패");
                            router.push('/')
                        }
                    });
                } else {
                    // 인증 실패 시 로직
                    alert(`인증 실패. ${rsp.error_msg}`);
                    router.push('/')
                }
            },
        );
    }, []);

    return (
        <div className="flex justify-center items-center h-screen">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">성인 인증이 진행중입니다.</h1>
        </div>
    )
}