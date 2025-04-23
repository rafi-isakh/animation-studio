'use client'
import { useState } from "react";
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Globe, Menu } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog"
import { Button } from "@/components/shadcnUI/Button"
import { Language } from "@/components/Types"
import SignInComponent from "@/components/SignInComponent"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/shadcnUI/DropdownMenu"
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { ContactForm } from "@/components/UI/FAQ";
import { useUser } from "@/contexts/UserContext";

export const LoginDialog = () => {
    return (
        <DialogContent showCloseButton={true} className="!bg-white md:p-4 px-0">
            <DialogHeader>
                <DialogTitle>Login</DialogTitle>
                <DialogDescription> Welcome to Toonyz </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <div className="flex justify-center items-center mx-auto">
                    <SignInComponent redirectTo="writing-class" />
                </div>
            </DialogFooter>
        </DialogContent>
    )
}


export const UserAccountDropdownMenu = ({ language }: { language: Language }) => {
    const [openContactForm, setOpenContactForm] = useState(false);

    return (
        <DropdownMenuContent className="w-56" side="bottom" align="start">
            <DropdownMenuItem>
                <Link href="/writing-class/downloads" className="flex flex-col items-start w-full">
                    <span className="text-md md:text-lg font-medium">{language === "en" ? "Downloads" : "작법서 다운로드"}</span>
                </Link>
            </DropdownMenuItem>
            {/* <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Link href="/docs" className="flex flex-col items-start w-full">
                        <span className="text-md md:text-lg font-medium">2. 온라인 강의 참여</span>
                    
                    </Link>
                </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <Dialog open={openContactForm} onOpenChange={setOpenContactForm}>
                    <Link 
                        href="#" 
                        className="flex flex-col items-start w-full" 
                        onClick={(event) => {
                            event.preventDefault();
                            setOpenContactForm(true);
                        }}>
                        <span className="text-md md:text-lg font-medium">고객 지원</span>
                    </Link>
                    <DialogContent showCloseButton={true} className="!bg-white">
                        <DialogHeader>
                            <DialogTitle>고객 지원</DialogTitle>
                        </DialogHeader>
                        <ContactForm />
                    </DialogContent>
                </Dialog>
            </DropdownMenuItem>
        </DropdownMenuContent>
    )
}


const WritingClassHeader = () => {
    const { language, setLanguage } = useLanguage();
    const { isLoggedIn, logout } = useAuth();
    const { nickname } = useUser();
    const [openLoginDialog, setOpenLoginDialog] = useState(false);
    const pathname = usePathname();


    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage as Language);
        console.log("Language changed to", newLanguage);
    }

    const handleSignOut = async (event: React.FormEvent) => {
        event.preventDefault();
        logout(true, '/writing-class');
    };

    return (
        <header className="bg-white text-black">
            <div className="container mx-auto px-4">
                <div className="flex items-center h-16">
                    <Link href="/" className="mr-6">
                        <span className="text-2xl font-bold">
                            <Image src="/toonyz_logo_pink.svg" alt="Toonyz Logo" width={100} height={100} />
                        </span>
                    </Link>

                    <div className="flex items-center text-sm mr-4">
                        <span className="text-gray-500 text-xs">{language === "en" ? "Digital Writing Bootcamp" : "디지털 글쓰기 부트캠프의 시작"}</span>
                        <Link href="/writing-class" className="md:inline-block hidden text-xs ml-1 text-[#DE2B74] hover:underline">
                            {language === "en" ? "Learn more" : "더 알아보기"}
                        </Link>
                    </div>

                    <div className="flex-1 flex items-center">
                        <div className="md:hidden flex-1 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        <Menu className="h-5 w-5" />
                                        <span>All</span>
                                    </div>
                                </DropdownMenuTrigger>
                                <UserAccountDropdownMenu language={language} />
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="md:flex items-center ml-4 space-x-6 hidden">
                        {isLoggedIn && <div className="text-xs">
                            <div>Hello, {nickname}</div>
                            <div className="font-bold flex items-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="flex items-center gap-1 cursor-pointer">
                                            <span>{language === "en" ? "Downloads" : "계정 & 다운로드"}</span> <ChevronDown className="h-3 w-3 ml-1" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <UserAccountDropdownMenu language={language} />
                                </DropdownMenu>
                            </div>
                        </div>}
                        <Link
                            href="#"
                            onClick={() => handleLanguageChange(language === "en" ? "ko" : "en")}
                            className="flex items-center text-base cursor-pointer">
                            <Globe className="h-4 w-4 mr-1" />
                            <span className="font-bold">{language === "en" ? "ENG" : "KOR"}</span>
                        </Link>

                        <div className="md:inline-flex hidden">
                            {!isLoggedIn && <Dialog open={openLoginDialog} onOpenChange={setOpenLoginDialog}>
                                <DialogTrigger asChild>
                                    {/* <Link href="#" className="flex items-center"> */}
                                    <span className="font-bold cursor-pointer">{language === "en" ? "LOGIN" : "로그인"}</span>
                                    {/* </Link> */}
                                </DialogTrigger>
                                <LoginDialog />
                            </Dialog>}
                            {isLoggedIn && <Link href="#" onClick={handleSignOut} className="flex items-center">
                                <span className="font-bold cursor-pointer">{language === "en" ? "LOGOUT" : "로그아웃"}</span>
                            </Link>}
                        </div>
                    </div>
                </div>
                {/* Secondary menu Navigation */}
                {/* <div className="flex items-center h-10 text-sm">
                    {[
                        "Webnovel Writing",
                        "Courses",
                    ].map((item) => (
                        <Link key={item} href="#" className="mr-4 hover:underline whitespace-nowrap">
                            {item}
                        </Link>
                    ))}
                </div> */}
            </div >
        </header >
    )
}

export default WritingClassHeader;


