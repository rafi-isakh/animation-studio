import Link from "next/link"
import Image from "next/image"
import { Globe, Menu } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Language } from "@/components/Types"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/shadcnUI/Popover"

const Header = () => {
    const { language, setLanguage } = useLanguage();

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage as Language);
        console.log("Language changed to", newLanguage);
    }

    return (
        <header className="bg-white text-black">
            <div className="container mx-auto px-4">
                <div className="flex items-center h-16">
                    <Link href="/" className="mr-6">
                        <span className="text-2xl font-bold text-amber-400">
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

                        <Link href="#" className="flex items-center">
                            <span className="font-bold">{language === "en" ? "LOGIN" : "로그인"}</span>
                        </Link>
                    </div>
                </div>

                {/* Secondary Navigation */}
                <div className="flex items-center h-10 text-sm">
                    <Popover>
                        <PopoverTrigger>
                            <Link href="#" className="flex items-center mr-4 cursor-pointer">
                                <Menu className="h-5 w-5 mr-1" />
                                All
                            </Link>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="bg-white md:w-[460px] lg:w-[700px]"
                            align="start"
                            sideOffset={5}
                        >
                            <ul className="flex md:flex-row flex-col gap-3 p-4 ">
                                <li className="w-full md:w-2/3">
                                    <Link
                                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gray-400 p-6 no-underline outline-none focus:shadow-md"
                                        href="/"
                                    >
                                        <div className="mb-2 mt-4 text-lg md:text-xl font-medium">
                                            Toonyz Writing 101
                                        </div>
                                        <p className="text-sm md:text-base leading-tight text-muted-foreground">
                                            Beautifully designed components built with Radix UI and
                                            Tailwind CSS.
                                        </p>
                                    </Link>

                                </li>
                                <div className="flex flex-col flex-1 w-full gap-4 items-start">
                                    <Link href="/docs" className="flex flex-col items-start w-full">
                                        <span className="text-lg md:text-xl font-medium">1. 작법서 구매</span>
                                        <span className="text-sm md:text-base">subtitle</span>
                                    </Link>
                                    <Link href="/docs" className="flex flex-col items-start w-full">
                                        <span className="text-lg md:text-xl font-medium">2. 온라인 강의 참여</span>
                                        <span className="text-sm md:text-base">subtitle</span>
                                    </Link>
                                    <Link href="/docs" className="flex flex-col items-start w-full">
                                        <span className="text-lg md:text-xl font-medium">3. 고객 지원</span>
                                        <span className="text-sm md:text-base">subtitle</span>
                                    </Link>
                                </div>
                            </ul>
                        </PopoverContent>
                    </Popover>
                    {[
                        "Webnovel Writing",
                        "Courses",
                    ].map((item) => (
                        <Link key={item} href="#" className="mr-4 hover:underline whitespace-nowrap">
                            {item}
                        </Link>
                    ))}
                </div>
            </div >
        </header >
    )
}

export default Header;