"use client"

import { Webtoon } from "./Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Link } from "@mui/material";
import { Ellipsis, CodeXml, Facebook, Twitter, Flag, CircleHelp, Plus } from "lucide-react";
import { useRef } from "react";
import { useState } from "react";
import { Button } from "@mui/material";
import { FacebookShareButton, 
        TwitterShareButton, 
        FacebookIcon, 
        TwitterIcon, 
        EmailShareButton, 
        EmailIcon, 
        LinkedinShareButton, 
        LinkedinIcon,
        TumblrShareButton,
        TumblrIcon,
        TelegramShareButton,
        TelegramIcon,
        WhatsappShareButton,
        WhatsappIcon,
        PinterestShareButton,
        PinterestIcon,
 } from "react-share";

export default function AuthorProfileCard({ webtoon }: { webtoon: Webtoon }) {
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const { language, dictionary } = useLanguage();
    const currentPageUrl = window.location.href;

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(!isUserDropdownOpen);
    }

    return (
        <div className="flex flex-col gap-2 justify-center items-center">
            <svg className="w-[30px] h-[30px] text-gray-400 rounded-full bg-gray-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
            </svg>
            { language === 'en' ? <>by{' '}</> : ''}
            {webtoon.user.nickname}
            {/* {webtoon.user.nickname && <p>by {webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname}</p>} */}
            <Button 
                variant="outlined" 
                className="flex flex-row justify-center items-center gap-1 border-2
                         border-gray-500 bg-white text-black px-2 py-1 rounded-md 
                         text-[10px] hover:opacity-80 transition duration-150 ease-in-out">
                <Plus size={10} /> Follow
            </Button>

            <div className="flex flex-col gap-2 justify-center items-center">
                <span className="text-[10px] uppercase"> Share </span>
              
                    <FacebookShareButton url={currentPageUrl} title={webtoon.title}>
                        <FacebookIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </FacebookShareButton>
             
                     <TwitterShareButton url={currentPageUrl} title={webtoon.title}>
                        <TwitterIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                     </TwitterShareButton>
            
                    <TumblrShareButton url={currentPageUrl} title={webtoon.title}> 
                        <TumblrIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </TumblrShareButton>

                    <TelegramShareButton url={currentPageUrl} title={webtoon.title}>
                        <TelegramIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </TelegramShareButton>

                    <WhatsappShareButton url={currentPageUrl} title={webtoon.title}>
                        <WhatsappIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </WhatsappShareButton>

                    <PinterestShareButton url={currentPageUrl} title={webtoon.title} media={webtoon.cover_art || ""}>
                        <PinterestIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </PinterestShareButton>


                  <li className="flex flex-col items-center justify-center list-none">
                    <button onClick={toggleUserDropdown} className="border-2 border-gray-100 bg-gray-100 text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                        <Ellipsis size={20} className="text-gray-600" />
                    </button>

                    {isUserDropdownOpen && (
                        <div id="user-dropdown" ref={userDropdownRef} className={`no-underline rounded-md md:border-0 border border-gray-400 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-32 dark:divide-gray-600`}>
                            <ul className="py-2 text-sm text-gray-700 dark:text-black no-underline" aria-labelledby="dropdownLargeButton">
                                <li className="px-3 py-2 hover:bg-gray-200  dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                    <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                        <Flag size={20} className="dark:text-white text-black" />
                                         {phrase(dictionary, "report", language)}
                                    </Link>
                                </li>
                                <li className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                    <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                        <CircleHelp size={20} className="dark:text-white text-black" />
                                        {phrase(dictionary, "help", language)}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}
                </li>

            </div>
        </div>
    )
}