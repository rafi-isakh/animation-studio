'use client';

import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { Button } from "@/components/shadcnUI/Button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcnUI/Card';
import { ReceiptText, ChevronRight, TicketPercent, MoveLeft, } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { usePathname } from "next/navigation";

export default function StarShopAside({ email }: { email: string }) {
    const { stars, email_hash } = useUser();
    const { dictionary, language } = useLanguage();
    const pathname = usePathname();

    const hideManuInPages = () => {
        if (pathname === '/stars') {
            return "hidden";
        }
        return "";
    }

    return (
        <aside className="relative flex flex-col gap-4 w-full md:w-1/4 my-5 md:p-0 p-1 flex-grow-0">
            <Link href="/stars" className={`${hideManuInPages()} items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors mb-2 ml-2 self-start flex md:hidden`}>
                <MoveLeft size={20} className='dark:text-white text-gray-500' />
                <p className="text-sm font-base">Back</p>
            </Link>
            <Card className="flex flex-col shadow-none bg-gray-200 dark:bg-[#211F21] dark:border-[#211F21]">
                <CardHeader>
                    <CardTitle>
                        {phrase(dictionary, "starShop_title", language)}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm font-pretendard">
                        {/* <span className="font-bold text-[#DE2B74]">{stars}</span> 개 </p>} */}
                        {language === 'ko' ? email ? <>별 <span className="font-bold text-[#DE2B74]">{stars.toLocaleString()}</span> 개</> : "로그인 하세요"
                            : email ? <><span className="font-bold text-[#DE2B74]">{stars.toLocaleString()}</span> Stars</> : "Please Login"}
                    </div>
                </CardContent>
            </Card>

            <Link href="/stars/transactions">
                <Button
                    variant="outline"
                    color="gray"
                    className="px-4 py-2 w-full justify-between border-none shadow-none"
                >
                    {/* View Transaction History */}
                    <span className="inline-flex items-center"><ReceiptText className="w-4 h-4 mr-2" /> {phrase(dictionary, "view_transaction_history", language)}</span>

                    <span className="justify-end self-end"> <ChevronRight className="w-4 h-4 ml-1" /></span>
                </Button>
            </Link>
            <Link href="/stars/redeem">
                <Button
                    variant="outline"
                    color="gray"
                    className="px-4 py-2 w-full justify-between border-none shadow-none"
                >
                    {/* Redeem Code  */}
                    <span className="inline-flex items-center">  <TicketPercent className="w-4 h-4 mr-2" /> {phrase(dictionary, "redeem_code", language)}</span>
                    <span className="justify-end self-end"><ChevronRight className="w-4 h-4 ml-1" /></span>
                </Button>
            </Link>
        </aside>
    )
}