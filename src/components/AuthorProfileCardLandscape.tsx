"use client"

import { Webtoon } from "./Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Link } from "@mui/material";
import { Ellipsis, Flag, CircleHelp, Plus, ExternalLink, Share } from "lucide-react";
import { useState, useRef } from "react";
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
    const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
    const shareDropdownRef = useRef<HTMLDivElement>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState('');

    const toggleUserDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsUserDropdownOpen(!isUserDropdownOpen);
    }

    const toggleShareDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsShareDropdownOpen(!isShareDropdownOpen);
    }

    return (
        <div className="flex flex-col gap-2 justify-center items-center" >
            <svg className="w-[30px] h-[30px] text-gray-400 rounded-full bg-gray-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
            </svg>
           
            <div className="relative flex flex-row gap-2 items-center">
            { language === 'en' ? <>by{' '}</> : ''}
            {webtoon.user.nickname}
                <button onClick={toggleUserDropdown} className=" bg-transparent text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                    <Ellipsis size={20} className="text-gray-600" />
                </button>
                   {isUserDropdownOpen && (
                        <div 
                            id="user-dropdown" 
                            ref={userDropdownRef} 
                            className={`absolute no-underline rounded-md md:border-0 border border-gray-400 
                                        top-5 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y
                                      divide-gray-100 shadow w-32 dark:divide-gray-600`}>
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
               </div>

               <div className="relative flex flex-col gap-2 items-center justify-center list-none">
               

                    {/* <Button 
                    color='gray' 
                    variant='outlined'
                    className='text-black dark:text-white border-2 bg-white border-gray-300 dark:border-white dark:bg-black rounded-sm px-4 py-2 w-28 flex flex-row justify-center items-center gap-1'> */}
                        {/* +Follow */}
                        {/* <Plus size={10} />
                        <span className='text-sm'>{phrase(dictionary, "follow", language)}</span>
                    </Button> */}


                    <Button 
                        color='gray'
                        variant='outlined'
                        onClick={toggleShareDropdown} 
                        className='text-black dark:text-white border-2 bg-white border-gray-300 dark:border-white dark:bg-black rounded-sm px-4 py-2 w-28 flex flex-row justify-center items-center gap-1'>
                        {/* share */}
                        <ExternalLink size={10} />
                        <span className='text-sm'>{phrase(dictionary, "share", language)}</span>
                    </Button>

                    {isShareDropdownOpen && (
                        <div 
                        id="share-dropdown" 
                        ref={shareDropdownRef} 
                        className={`absolute rounded-md md:border-0 border
                                    border-gray-400 z-10 font-normal 
                                    left-1/2 transform -translate-x-1/2 -bottom-24
                                    bg-white dark:bg-black dark:text-white shadow w-52`}>
                            <p className='text-center font-bold text-sm m-1'> SHARE PROFILE </p>
                            <div className="flex flex-row gap-2 p-4">
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
                            </div>
                        </div>
                    )}
                </div>
          


        </div>
    )
}


