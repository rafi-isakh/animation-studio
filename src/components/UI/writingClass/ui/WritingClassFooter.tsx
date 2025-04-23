'use client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/shadcnUI/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcnUI/Popover'
import { Globe, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'
import { Language } from '@/components/Types'

export default function WritingClassFooter() {
    const { language, setLanguage } = useLanguage();

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage as Language);
        console.log("Language changed to", newLanguage);
    }

    return (
        <footer className = " bg-zinc-900 text-white py-8" >
            <div className="md:max-w-screen-lg w-full mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold mb-4">{language === "en" ? "Site map" : "사이트 맵"}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="https://stelland.io" target="_blank" className="text-sm text-gray-400 hover:text-white">
                                    {language === "en" ? "Company" : "회사 소개"}
                                </Link>
                            </li>
                            <li>
                                <Link href="https://toonyz.com" target="_blank" className="text-sm text-gray-400 hover:text-white">
                                    {language === "en" ? "Go to Toonyz" : "투니즈 바로가기"}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">{language === "en" ? "Contact" : "고객 지원"}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#" className="text-sm text-gray-400 hover:text-white">
                                    hello@stelland.io
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-gray-400 hover:text-white">
                                    {language === "en" ? "Terms of Service" : "이용 약관"}
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-gray-400 hover:text-white">
                                    {language === "en" ? "Help Center" : "문의 하기"}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        {/* <h3 className="text-lg font-bold mb-4">Resources</h3> */}
                        <ul className="flex flex-row gap-2 justify-end">
                            <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                                <Link href="https://x.com/stelland_hello" target="_blank" className="text-sm text-gray-400 hover:text-white">
                                    <Twitter className="w-4 h-4" />
                                </Link>
                            </li>
                            <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                                <Link href="https://www.instagram.com/stelland_official/" target="_blank" className="text-sm text-gray-400 hover:text-white">
                                    <Instagram className="w-4 h-4" />
                                </Link>
                            </li>
                            <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                                <Link href="https://www.linkedin.com/company/stellandio" target="_blank" className="text-sm text-gray-400 hover:text-white">
                                    <Linkedin className="w-4 h-4" />
                                </Link>
                            </li>
                            <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                                <Link href="#" className="text-sm text-gray-400 hover:text-white">
                                    <Youtube className="w-4 h-4" />
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-left">
                    <div className="flex flex-row justify-between items-center">
                        <p className="text-sm text-gray-400 text-center">
                            &copy; {new Date().getFullYear()} Stella&. All rights reserved.
                        </p>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="inline-flex items-center justify-center text-sm text-gray-400 text-center cursor-pointer">
                                    <Globe className="w-4 h-4" />
                                    {language === "en" ? "Language" : "언어"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit border border-gray-800 rounded-md bg-gray-900">
                                <div className="flex flex-col gap-2">
                                    <Button onClick={() => handleLanguageChange("en")} variant="ghost" className="text-sm text-gray-400 hover:text-white cursor-pointer">
                                        English
                                    </Button>
                                    <Button onClick={() => handleLanguageChange("ko")} variant="ghost" className="text-sm text-gray-400 hover:text-white cursor-pointer">
                                        한국어
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
     </footer >
    )
}