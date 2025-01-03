"use client"
import { useState, useEffect, useRef } from "react";
import { Webtoon } from "@/components/Types";
import { Button } from "@mui/material";
import Image from "next/image";
import { code_to_lang, phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import moment from "moment";
import { Heart, Share } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import Link from "next/link";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import DictionaryPhrase from "./DictionaryPhrase";
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

export default function WebtoonInfoAndPictureComponent({ webtoon, coverArt }: { webtoon: Webtoon, coverArt: string }) {
    const { language, dictionary } = useLanguage();
    const formattedDate = moment(webtoon.created_at).format('MM/DD/YYYY hh:mm');
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useUser();
    const [tags, setTags] = useState([]);
    const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
    const shareDropdownRef = useRef<HTMLDivElement>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState('');

    useEffect(() => {
        if (window !== undefined) { 
            setCurrentPageUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        const tagsJSON = JSON.parse(webtoon.tags);
        setTags(tagsJSON);
    }, [webtoon.tags]);

    const toggleShareDropdown = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsShareDropdownOpen(prev => !prev);
    }

     // Add click handler to close dropdown when clicking outside
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const clickedElement = event.target as Node;
            
            if (shareDropdownRef.current && !shareDropdownRef.current.contains(clickedElement)) {
                setIsShareDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative md:w-[300px] md:h-screen h-full top-0  bg-gradient-to-b from-transparent to-transparent justify-start self-start rounded-xl mx-auto">
            {/* Blurred background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-10 rounded-xl md:h-screen h-full"
                //   bg-[#929292]/10
                style={{
                    backgroundImage: `url(${coverArt})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-black/80 rounded-xl" />
            {/* Existing content container */}
            <div className="relative z-10 flex md:flex-row flex-col space-y-1 w-full md:h-screen rounded-xl">
                <div className="flex flex-col space-y-2">
                    <div className="md:px-4 p-2">
                        <div className="md:w-[270px] md:h-auto w-full self-center rounded-xl mx-auto pt-1">
                            <Image
                                src={coverArt}
                                alt={webtoon.title}
                                width={270}
                                height={350}
                                className="object-cover w-full h-full rounded-xl"
                            />
                        </div>
                        {/* <span className="text-sm text-gray-400">{phrase(dictionary, webtoon.genre, language)}</span> */}
                        <div className="flex flex-col items-center py-10">
                        <OtherTranslateComponent content={webtoon.title} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="title" classParams="text-2xl font-bold self-center text-center" />
                        <p className="text-center">{webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname}</p>
                        <ul className="flex flex-row gap-2 justify-center items-center">
                            {
                                webtoon.genre && (
                                    <li className="text-sm text-gray-500 flex items-center" >
                                        <DictionaryPhrase phraseVar={webtoon.genre.toLowerCase()} />
                                        <span style={{
                                            height: '2px',
                                            width: '2px',
                                            backgroundColor: '#bbb',
                                            borderRadius: '50%',
                                            display: 'inline-block',
                                            marginLeft: '5px',
                                            marginRight: '0px',
                                            verticalAlign: 'middle'
                                        }} />
                                    </li>
                                )
                            }
                            {/* 무료/프리미엄 */}
                            <li className="text-sm text-gray-500">
                                {phrase(dictionary, "premium", language)}
                            </li>
                        </ul>

                        {/* <p className="text-sm text-gray-400">{formattedDate}</p> */}
                        <OtherTranslateComponent content={webtoon.description} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="description" classParams="text-sm text-gray-800 dark:text-white" />
                        <div className="flex flex-row gap-2 pt-5 pb-5 w-full">
                            {/* button's top padding 5 */}
                            <Button
                                sx={{
                                    backgroundColor: '#8A2BE2',
                                    color: 'white',
                                    borderRadius: '5px',
                                    height: '40px',
                                    transition: 'background-color 0.3s ease-in-out',
                                    '&:hover': {
                                        backgroundColor: '#8A2BE2',
                                    },
                                }}
                                variant="contained"
                                disableElevation
                                className="bg-gray-500 hover:bg-[#DB2777] text-white rounded-md w-full md:py-2 py-1 transition duration-150 ease-in-out">
                                <Link
                                    href={`/webtoons/${webtoon.id}/001`}
                                    className="text-center flex flex-row items-center"
                                >
                                    {/* Start To Read Episode 1 &gt; */}
                                    {phrase(dictionary, "start_to_read_episode_1", language)}
                                </Link>
                            </Button>
                            <Link
                                href=''
                                className="text-center flex justify-center items-center contents-center md:p-0 p-1 flex-shrink-0
                                            group border w-[40px] h-[40px] border-gray-500 hover:border-[#DB2777]  hover:bg-[#DB2777]
                                             text-white rounded-md transition duration-150 ease-in-out
                                            "
                            >
                                <Heart size={20} className="text-gray-500 group-hover:text-white" />
                                {/* {
                                        likeToggle ?
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-solid fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                            :
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-regular fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                    } */}
                            </Link>
                            <div className="relative">
                                <Link
                                    onClick={toggleShareDropdown}
                                    href=''
                                    className="text-center flex justify-center items-center contents-center md:p-0 p-1 flex-shrink-0
                                                  group border w-[40px] h-[40px] border-gray-500 hover:border-[#DB2777] hover:bg-[#DB2777]
                                                text-white rounded-md transition duration-150 ease-in-out"
                                >
                                    <Share size={20} className="text-gray-500 group-hover:text-white" />
                                </Link>
                                {isShareDropdownOpen && (
                                    <div 
                                    id="share-dropdown" 
                                    ref={shareDropdownRef} 
                                    className={`absolute rounded-md md:border-0 border
                                              border-gray-400 z-10 font-normal 
                                              right-0 top-[44px]
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
                        <div className="flex flex-col gap-2 px-2 pt-5 pb-5 w-full bg-white dark:bg-gray-500 rounded-lg ">
                            <div className="flex flex-row gap-2">
                                <p className="text-sm text-gray-500 dark:text-white self-center">
                                    <span className="font-extrabold">대여권</span> 0장
                                </p>
                            
                            </div>
                            <hr/>
                            <p className="text-sm text-gray-500 dark:text-white">
                                   <span className="font-extrabold"> 기다리면 무료 </span> 0장 
                           </p>
                        </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    )
}   
