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


    return (
        <div className="relative flex flex-col md:h-[439px] h-auto justify-center items-center">
            {/* Blurred background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-10 backdrop-blur-[300px]"
                style={{
                    backgroundImage: `url(${coverArt})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Existing content container */}
            <div className="relative z-10 flex md:flex-row flex-col justify-evenly items-center md:h-[439px] h-auto space-y-1 bg-[#929292]/10 w-full">

                <div className="flex flex-col gap-2 p-10 w-[360px] md:w-[450px]">
                    <div className="md:px-0 px-0 space-y-2">
                        <span className="text-sm text-gray-400">{phrase(dictionary, webtoon.genre, language)}</span>
                        <OtherTranslateComponent content={webtoon.title} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="title" classParams="text-2xl font-bold" />
                        <p>{webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname}</p>
                        <ul className="flex flex-row gap-2">
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

                        <OtherTranslateComponent content={webtoon.title} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="title" classParams="text-2xl font-bold" />
                        <p> {webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname}</p>

                        <ul className="flex flex-row gap-2 py-2">
                            {/* tags padding 2 */}
                            {
                                webtoon.genre && (
                                    <li className="text-sm text-black dark:text-white rounded-md px-2 border border-gray-500 hover:bg-[#8A2BE2] transition duration-150 ease-in-out">
                                        <DictionaryPhrase phraseVar={webtoon.genre.toLowerCase()} />
                                    </li>
                                )
                            }
                            {tags.map((tag: string, index: number) => (
                                <li key={`tag-${index}`}
                                    className="text-sm text-black rounded-md px-2 border border-gray-500 hover:bg-[#8A2BE2] transition duration-150 ease-in-out">#{tag}</li>
                            ))}
                            {/* 연령별 태그
                               <li className="text-sm text-black rounded-md bg-green-400 px-2 transition duration-150 ease-in-out self-center text-center">13+</li> */}
                        </ul>



                        {/* <p className="text-sm text-gray-400">{formattedDate}</p> */}
                        <OtherTranslateComponent content={webtoon.description} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="description" classParams="text-sm text-gray-800 dark:text-white" />

                        <div className="flex flex-row gap-2 pt-5">
                            {/* button's top padding 5 */}
                            <Button
                                sx={{
                                    backgroundColor: '#8A2BE2',
                                    color: 'white',
                                    borderRadius: '5px',
                                    width: '200px',
                                    height: '40px',
                                    transition: 'background-color 0.3s ease-in-out',
                                    '&:hover': {
                                        backgroundColor: '#8A2BE2',
                                    },
                                }}
                                variant="contained"
                                disableElevation
                                className="bg-gray-500 hover:bg-[#8A2BE2] text-white rounded-md md:w-[200px] w-full md:py-2 py-1 transition duration-150 ease-in-out">
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
                                className="text-center flex justify-center items-center contents-center md:p-0 p-1
                                               group border w-[40px] h-[40px] border-gray-500 hover:border-[#8A2BE2]  hover:bg-[#8A2BE2]
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
                                    className="text-center flex justify-center items-center contents-center md:p-0 p-1
                                                  group border w-[40px] h-[40px] border-gray-500 hover:border-[#8A2BE2] hover:bg-[#8A2BE2]
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
                    </div>
                </div>

                <div className="w-[270px] h-auto min-h-[350px] order-first md:order-last md:pt-0 pt-5">
                    <Image
                        src={coverArt}
                        alt={webtoon.title}
                        width={270}
                        height={350}
                        className="object-cover w-full h-full"
                    />
                </div>
            </div>

        </div>
    )
}   
