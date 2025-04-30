"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
export default function AdultVerificationRedirectPage() {
    const params = useSearchParams();
    const imp_uid = params.get('imp_uid') as string;
    const merchant_uid = params.get('merchant_uid') as string;
    const success = params.get('success') as string;
    const webnovel_id = params.get('webnovel_id') as string;
    const router = useRouter();
    const { setIsAdult } = useUser();

    useEffect(() => {
    if (success === "true") {
        alert("인증 성공");
        fetch("/api/verify_as_adult", {
            method: "POST",
            body: JSON.stringify({
                imp_uid: imp_uid,
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
        }
    }, [success, imp_uid, webnovel_id, router]);
    return (
        <div className="flex justify-center items-center h-screen">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">성인 인증이 진행중입니다.</h1>
        </div>
    )
}