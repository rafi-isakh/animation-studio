'use client';

import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/shadcnUI/Button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcnUI/Card';
import { ReceiptText, ChevronRight, TicketPercent, MoveLeft, Power, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { usePathname } from "next/navigation";
import { MdStars } from 'react-icons/md';
import { UserStripped } from "@/components/Types";

export default function PageAsideBar({ user, email, mode }: { user?: UserStripped, email?: string, mode: "starShop" | "viewProfile" }) {
    const { id, stars, email_hash, english_stars, tickets } = useUser();
    const { dictionary, language } = useLanguage();
    const pathname = usePathname();
    const { logout, isLoggedIn } = useAuth();

    const hideManuInPages = () => {
        if (mode === "starShop" && pathname === '/stars') {
            return "hidden";
        }
        if (mode === "viewProfile" && pathname === '/view_profile/[id]') {
            return "hidden";
        }
        return "";
    }

    const handleSignOut = async (event: React.FormEvent) => {
        event.preventDefault();
        logout(true, '/');
    };

    const StarShopAsideLayout = ({ children }: { children: React.ReactNode }) => {
        return (
            <aside className="relative flex flex-col gap-4 w-full md:w-1/4 md:my-0 my-5 flex-grow-0 flex-shrink-0 ">
                <Link href={`${mode === "starShop" ? "/stars" : mode === "viewProfile" ? "/" : ""}`} className={`${hideManuInPages()} items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors mb-2 ml-2 self-start flex md:hidden`}>
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
                        <div className="text-sm font-pretendard flex flex-col gap-2">

                            {language === 'ko' ? isLoggedIn ? <>별 (한국어) <span className="font-bold text-[#DE2B74]">{stars.toLocaleString()}</span> 개</> : "로그인 하세요"
                                : isLoggedIn ? <><span className="font-bold text-[#DE2B74]">{stars.toLocaleString()}</span> Korean Stars</> : "Please Login"}
                            {language === 'ko' ? isLoggedIn ? <>별 (영어) <span className="font-bold text-[#DE2B74]">{english_stars.toLocaleString()}</span> 개</> : "로그인 하세요"
                                : isLoggedIn ? <><span className="font-bold text-[#DE2B74]">{english_stars.toLocaleString()}</span> English Stars</> : "Please Login"}
                            {language === 'ko' ? isLoggedIn ? <>티켓 <span className="font-bold text-[#DE2B74]">{tickets.toLocaleString()}</span> 개</> : "로그인 하세요"
                                : isLoggedIn ? <><span className="font-bold text-[#DE2B74]">{tickets.toLocaleString()}</span> Tickets</> : "Please Login"}
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
                {children}
            </aside>
        )
    }

    if (mode === "starShop") {
        return <StarShopAsideLayout><></></StarShopAsideLayout>
    }

    if (mode === "viewProfile") {
        return (
            id.toString() === user?.id.toString() && (
                <StarShopAsideLayout>
                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            color="gray"
                            className="px-4 py-2 w-full justify-between border-none shadow-none"
                        >

                            <span className="inline-flex items-center"><LayoutDashboard className="w-4 h-4 mr-2" /> {phrase(dictionary, "go_to_dashboard", language)}</span>
                            <span className="justify-end self-end"> <ChevronRight className="w-4 h-4 ml-1" /></span>
                        </Button>
                    </Link>
                    <Link href="#">
                        <Button
                            variant="outline"
                            color="gray"
                            className="px-4 py-2 w-full justify-between border-none shadow-none"
                            onClick={(e) => {
                                handleSignOut(e);
                            }}
                        >
                            <span className="inline-flex items-center"> <Power className="w-4 h-4 mr-2" /> {phrase(dictionary, "logout", language)} </span>
                            <span className="justify-end self-end"><ChevronRight className="w-4 h-4 ml-1" /></span>
                        </Button>
                    </Link>
                </StarShopAsideLayout>
            )
        )
    }
}