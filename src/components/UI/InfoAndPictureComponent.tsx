"use client"
import { useState, useEffect, useRef } from "react";
import { Webtoon, Webnovel } from "@/components/Types";
import { Button, useMediaQuery, Modal, Box, Skeleton } from "@mui/material";
import Image from "next/image";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Share, Copy, ChevronRight, Trash, PenLine } from "lucide-react"
import Link from "next/link";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { MdStars } from "react-icons/md";
import DictionaryPhrase from "@/components/DictionaryPhrase";
import {
    FacebookShareButton,
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
import { getImageUrl } from "@/utils/urls";
import { createEmailHash } from '@/utils/cryptography'
import { useUser } from '@/contexts/UserContext';
import { grayTheme, NoCapsButton } from '@/styles/BlackWhiteButtonStyle';
import { useModalStyle } from "@/styles/ModalStyles";
import { TranslateWebnovelAllButton } from "@/components/TranslateWebnovelAllButton";


interface InfoAndPictureProps {
    content: Webtoon | Webnovel;
    coverArt: string;
    isWebtoon?: boolean;
    children?: React.ReactNode;
    onNewChapter?: () => void;
    onDelete?: () => void;
}

export default function InfoAndPictureComponent({
    content,
    coverArt,
    isWebtoon = false,
    onNewChapter,
    onDelete
}: InfoAndPictureProps) {
    const { language, dictionary } = useLanguage();
    const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
    const shareDropdownRef = useRef<HTMLDivElement>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState('');
    const [tags, setTags] = useState([]);
    const author_email = content.user.email_hash;
    const { email } = useUser();
    const isMediumScreen = useMediaQuery('(min-width:768px)');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (window !== undefined) {
            setCurrentPageUrl(window.location.href);
        }
        console.log("content", content);
    }, []);

    useEffect(() => {
        if (content.tags) {
            const tagsJSON = JSON.parse(content.tags);
            setTags(tagsJSON);
        }
    }, [content.tags]);

    const toggleShareDropdown = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsShareDropdownOpen(prev => !prev);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
                setIsShareDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const isAuthor = (): boolean => {
        // if (!email || !author_email) return false;
        const userEmailHash = createEmailHash(email);
        const authorEmailHash = author_email
        return userEmailHash === authorEmailHash;
    };

    const isJongmin = () => {
        const userEmailHash = createEmailHash(email);
        const jongminEmailHash = createEmailHash("jongminbaek@stelland.io")
        return userEmailHash == jongminEmailHash
    }

    return (
        <div className="relative md:w-[300px] md:h-screen h-full top-0 bg-gradient-to-b from-transparent to-transparent justify-start self-start rounded-xl mx-auto">
            {/* Blurred background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-10 rounded-xl md:h-screen h-full"
                style={{
                    backgroundImage: `url(${isWebtoon ? coverArt : getImageUrl(coverArt)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-black/80 rounded-xl" />

            {/* Content */}
            <div className="relative z-10 flex md:flex-row flex-col space-y-1 w-full md:h-screen rounded-xl">
                <div className="flex flex-col space-y-2">
                    <div className="md:px-4 md:p-2">
                        {/* Cover Image */}
                        <div className="md:w-[270px] md:h-auto w-full self-center rounded-xl mx-auto md:pt-1 pt-0 ">
                            <Image
                                src={isWebtoon ? coverArt : getImageUrl(coverArt)}
                                alt={content.title}
                                width={270}
                                height={350}
                                className="object-cover w-full h-full rounded-xl"
                                placeholder="blur"
                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                            />
                        </div>

                        {/* Content Info */}
                        <div className="flex flex-col items-center py-10">
                            {isWebtoon ? content.title :
                                <OtherTranslateComponent
                                    content={content.title}
                                    elementId={content.id.toString()}
                                    elementType={isWebtoon ? 'webtoon' : 'webnovel'}
                                    elementSubtype="title"
                                    classParams="text-2xl font-bold self-center text-center"
                                />
                            }

                            <p className="text-center">
                                {content.user.nickname === 'Anonymous' ? '' : content.user.nickname}
                            </p>

                            {/* Genre and Type */}
                            <ul className="flex flex-row justify-center items-center">
                                {content.genre && (
                                    <li className="text-sm text-gray-500 flex items-center">
                                        <DictionaryPhrase phraseVar={content.genre.toLowerCase()} />
                                        <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full" />
                                    </li>
                                )}
                                <li className="text-sm text-gray-500">
                                    {!isWebtoon && content.premium ? phrase(dictionary, "premium", language) : phrase(dictionary, "free", language)}
                                </li>
                            </ul>

                            <div className="mt-2">
                                {/* Description */}
                                {isWebtoon ? content.description :
                                    <OtherTranslateComponent
                                        content={content.description}
                                        elementId={content.id.toString()}
                                        elementType={isWebtoon ? 'webtoon' : 'webnovel'}
                                        elementSubtype="description"
                                        classParams="text-sm text-gray-800 dark:text-white"
                                    />
                                }
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-row gap-2 pt-5 pb-5 w-full">
                                {/* Read Button */}
                                <Button
                                    sx={{
                                        backgroundColor: '#DE2B74',
                                        color: 'white',
                                        borderRadius: '5px',
                                        height: '40px',
                                        '&:hover': {
                                            backgroundColor: '#DE2B74',
                                        },
                                    }}
                                    variant="contained"
                                    disableElevation
                                    className="w-full"
                                >
                                    <Link
                                        href={isWebtoon ? `/webtoons/${content.id}/001` :
                                            content.chapters.length > 0 ? `/chapter_view/${content.chapters[content.chapters.length - 1]?.id}` : `#`}
                                        className="text-center flex flex-row items-center"
                                    >
                                        {phrase(dictionary, "start_to_read_episode_1", language)}
                                    </Link>
                                </Button>

                                {/* Like Button */}
                                <Link
                                    href=""
                                    className="flex-shrink-0 w-[40px] h-[40px] border border-gray-500 hover:border-[#DB2777] hover:bg-[#DB2777] rounded-md flex items-center justify-center group"
                                >
                                    <Heart size={20} className="text-gray-500 group-hover:text-white" />
                                </Link>

                                {/* Share Button and Dropdown */}
                                <div className="relative">
                                    <Link
                                        onClick={toggleShareDropdown}
                                        href=""
                                        className="flex-shrink-0 w-[40px] h-[40px] border border-gray-500 hover:border-[#DB2777] hover:bg-[#DB2777] rounded-md flex items-center justify-center group"
                                    >
                                        <Share size={20} className="text-gray-500 group-hover:text-white" />
                                    </Link>

                                    {/* Share Dropdown */}
                                    {isShareDropdownOpen && (
                                        <div
                                            id="share-dropdown"
                                            ref={shareDropdownRef}
                                            className={`absolute rounded-md md:border-0 border
                                              border-gray-400 z-10 font-normal 
                                              right-0 top-[44px]
                                              bg-white dark:bg-black dark:text-white shadow w-52`}>
                                            <p className='text-center font-bold text-sm m-1'> SHARE PROFILE </p>
                                            <div className="flex flex-col">
                                                <div className="flex flex-row gap-2 p-4">
                                                    <FacebookShareButton url={currentPageUrl} title={content.title}>
                                                        <FacebookIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                                                    </FacebookShareButton>

                                                    <TwitterShareButton url={currentPageUrl} title={content.title}>
                                                        <TwitterIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                                                    </TwitterShareButton>

                                                    <TumblrShareButton url={currentPageUrl} title={content.title}>
                                                        <TumblrIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                                                    </TumblrShareButton>

                                                    <TelegramShareButton url={currentPageUrl} title={content.title}>
                                                        <TelegramIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                                                    </TelegramShareButton>

                                                    <WhatsappShareButton url={currentPageUrl} title={content.title}>
                                                        <WhatsappIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                                                    </WhatsappShareButton>

                                                    <PinterestShareButton url={currentPageUrl} title={content.title} media={content.cover_art || ""}>
                                                        <PinterestIcon size={22} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                                                    </PinterestShareButton>
                                                </div>


                                                <div className="flex flex-row gap-2 p-4">
                                                    <p className="text-center text-[10px] text-gray-500">{currentPageUrl} </p>
                                                    <Button
                                                        sx={{
                                                            minWidth: '0', // Remove default minimum width
                                                            padding: '4px', // Minimal padding or '0px' for no padding
                                                            color: 'white',
                                                            borderRadius: '5px',
                                                            transition: 'background-color 0.3s ease-in-out',
                                                            '&:hover': {
                                                                color: '#8A2BE2',
                                                            },
                                                        }}
                                                        variant="text" className="text-gray-500">
                                                        <Copy size={10} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isJongmin() &&
                                <div className="pb-5 w-full">
                                    <TranslateWebnovelAllButton webnovel={content as Webnovel} />
                                </div>
                            }
                            {/* writing button */}
                            {isAuthor() &&
                                <>
                                    <div className='flex flex-row gap-4 w-full justify-center items-center pb-5'>
                                        <NoCapsButton
                                            color='gray'
                                            variant='outlined'
                                            onClick={onNewChapter}
                                            className='px-4 flex-1 flex items-center justify-center hover:border-[#DB2777] text-black dark:text-white hover:text-[#DB2777]'
                                        >
                                            {isMediumScreen ? <p className='text-black dark:text-white  hover:text-[#DB2777]'>{phrase(dictionary, "uploadNewChapter", language)}</p> : (<> <PenLine className='hover:text-[#DB2777]' size={18} /> </>)}
                                        </NoCapsButton>
                                        <NoCapsButton
                                            color='gray'
                                            variant='outlined'
                                            onClick={() => setShowDeleteModal(true)}
                                            className='px-4 flex-1 flex items-center justify-center hover:border-[#DB2777] text-black dark:text-white hover:text-[#DB2777]'
                                        >
                                            {isMediumScreen ? <p className='text-black dark:text-white  hover:text-[#DB2777]'>{phrase(dictionary, "deleteWebnovel", language)}</p> : (<> <Trash className='hover:text-[#DB2777]' size={18} /> </>)}
                                        </NoCapsButton>
                                    </div>

                                    <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                                        <Box sx={useModalStyle}>
                                            <div className='flex flex-col space-y-4 items-center justify-center'>
                                                <p className='text-lg font-bold text-black dark:text-black'>{phrase(dictionary, "deleteWebnovelConfirm", language)}</p>
                                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={onDelete}>{phrase(dictionary, "yes", language)}</Button>
                                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowDeleteModal(false)}>{phrase(dictionary, "no", language)}</Button>
                                            </div>
                                        </Box>
                                    </Modal>
                                </>
                            }


                            {/* Premium Info */}
                            <div className="flex flex-col gap-2 px-2 md:pt-5 md:pb-5 pt-3 pb-3 w-full bg-gray-100 dark:bg-gray-900 rounded-lg">
                                {/* <div className="flex flex-row gap-2">
                                    <p className="text-sm text-gray-500 dark:text-white self-center">
                                        <span className="font-extrabold">대여권</span> 0장
                                    </p>
                                </div>
                                <hr /> */}
                                <div className="text-sm text-gray-500 dark:text-white flex flex-row gap-2 items-center justify-between">
                                    <div className="font-extrabold flex flex-row gap-2 items-center cursor-pointer">
                                        <MdStars className="text-xl text-[#D92979]" />
                                        <Link href={`/stars`}>
                                            <p>
                                                {/* 별 구매하기  */}
                                                {phrase(dictionary, "buyStars", language)}
                                            </p>
                                        </Link>
                                    </div>
                                    <ChevronRight size={16} className="text-black dark:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}