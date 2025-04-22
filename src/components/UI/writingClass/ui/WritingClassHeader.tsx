import { useState } from "react";
import Link from "next/link"
import Image from "next/image"
import { Globe, Menu } from "lucide-react"
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

const WritingClassHeader = () => {
    const { language, setLanguage } = useLanguage();
    const { isLoggedIn, logout } = useAuth();
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
                        <button className="md:inline-block hidden text-xs ml-1 text-[#DE2B74] hover:underline">
                            {language === "en" ? "Learn more" : "더 알아보기"}
                        </button>
                    </div>

                    <div className="flex-1 flex items-center">
                    </div>

                    <div className="md:flex items-center ml-4 space-x-6 hidden">
                        {/* <div className="text-xs">
                            <div>Hello, writer</div>
                            <div className="font-bold flex items-center">
                            Account & Lists <ChevronDown className="h-3 w-3 ml-1" />
                            </div>
                        </div> */}

                        <Link
                            href="#"
                            onClick={() => handleLanguageChange(language === "en" ? "ko" : "en")}
                            className="flex items-center text-base cursor-pointer">
                            <Globe className="h-4 w-4 mr-1" />
                            <span className="font-bold">{language === "en" ? "ENG" : "KOR"}</span>
                        </Link>

                        {!isLoggedIn && <Dialog open={openLoginDialog} onOpenChange={setOpenLoginDialog}>
                            <DialogTrigger asChild>
                                {/* <Link href="#" className="flex items-center"> */}
                                <span className="font-bold">{language === "en" ? "LOGIN" : "로그인"}</span>
                                {/* </Link> */}
                            </DialogTrigger>
                            <DialogContent showCloseButton={true}>
                                <DialogHeader>
                                    <DialogTitle>Login</DialogTitle>
                                    <DialogDescription> Welcome to Toonyz </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <div className="mx-auto">
                                        <SignInComponent />
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>}
                        {isLoggedIn && <Link href="#" onClick={handleSignOut} className="flex items-center">
                            <span className="font-bold">{language === "en" ? "LOGOUT" : "로그아웃"}</span>
                        </Link>}
                    </div>
                </div>
                {/* Secondary Navigation */}
                <div className="flex items-center h-10 text-sm">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-1 cursor-pointer">
                                <Menu className="h-5 w-5" />
                                <span>All</span>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" side="bottom" align="start">
                            <DropdownMenuItem>
                                <Link href="/docs" className="flex flex-col items-start w-full">
                                    <span className="text-md md:text-lg font-medium">1. 작법서 구매</span>
                                    {/* <span className="text-sm md:text-base">subtitle</span> */}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/docs" className="flex flex-col items-start w-full">
                                    <span className="text-md md:text-lg font-medium">2. 온라인 강의 참여</span>
                                    {/* <span className="text-sm md:text-base">subtitle</span> */}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/docs" className="flex flex-col items-start w-full">
                                    <span className="text-md md:text-lg font-medium">3. 고객 지원</span>
                                    {/* <span className="text-sm md:text-base">subtitle</span> */}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* {[
                        "Webnovel Writing",
                        "Courses",
                    ].map((item) => (
                        <Link key={item} href="#" className="mr-4 hover:underline whitespace-nowrap">
                            {item}
                        </Link>
                    ))} */}
                </div>
            </div >
        </header >
    )
}

export default WritingClassHeader;