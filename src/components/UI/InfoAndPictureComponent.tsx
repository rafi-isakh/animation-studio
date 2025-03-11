"use client"
import { useState, useEffect, useRef } from "react";
import { Webtoon, Webnovel, ImageOrVideo } from "@/components/Types";
import { Button, useMediaQuery, Modal, Box, Skeleton, Tooltip } from "@mui/material";
import Image from "next/image";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Share, Copy, ChevronRight, Trash, PenLine, Eye } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import ShareAsToonyzPostModal from "@/components/ShareAsToonyzPostModal";
import { CircularProgress } from "@mui/material";
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
    const { id, email } = useUser();
    const isMediumScreen = useMediaQuery('(min-width:768px)');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pictures, setPictures] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const { toast } = useToast();
    const [videoFileName, setVideoFileName] = useState('');
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    const [loadingTrailerGeneration, setLoadingTrailerGeneration] = useState(false);

    useEffect(() => {
        if (window !== undefined) {
            setCurrentPageUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        if (content.tags) {
            const tagsJSON = JSON.parse(content.tags);
            setTags(tagsJSON);
        }
    }, [content?.tags]);

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
        return id === content.user.id.toString()
    };

    const isJongmin = () => {
        const userEmailHash = createEmailHash(email);
        const jongminEmailHash = createEmailHash("jongminbaek@stelland.io")
        return userEmailHash == jongminEmailHash
    }

    const generateTrailer = async (chapter_ids: number[]) => {
        setLoadingTrailerGeneration(true);
        const response = await fetch(`/api/generate_trailer_prompts_and_pictures`, {
            method: 'POST',
            body: JSON.stringify({ chapter_ids: chapter_ids, trailer_style: "default", trailer_type: "B" })
        })
        const data = await response.json();
        console.log('data', data);
        setPictures(data.images);
        setPrompts(data.prompts);
        await makeVideo(data.images, data.prompts, data.narrations);
    }

    // TODO: refactor this function as it's copied from FloatingMenuComponent
    const makeVideo = async (pictures: string[], prompts: string[], narrations: string[]) => {
        console.log("making video!");
        const videoUrls: string[] = [];
        const processPromises = pictures.map(async (picture, i) => {
            const pictureFilename = uuidv4();
            const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
                method: 'POST',
                body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}.png`, fileType: "image/png", bucketName: "toonyzbucket" }),
            });
            if (!uploadResponse.ok) {
                toast({
                    title: "Error", 
                    description: "Failed to upload picture to s3, please try again later",
                    variant: "destructive"
                })
                throw new Error('Failed to upload picture to s3');
            }
            const image_url = getImageUrl(`${pictureFilename}.png`);
            const response = await fetch('/api/generate_video', {
                method: 'POST',
                body: JSON.stringify({ video_prompt: prompts[i], image_url: image_url }),
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to generate video, please try again later", 
                    variant: "destructive"
                })
                throw new Error('Failed to generate video');
            }
            const data = await response.json();
            const url = data.video_url;
            console.log(`video ${i} url: `, url);
            return url;
        });

        const urls = await Promise.all(processPromises);
        videoUrls.push(...urls);

        const stitchedResponse = await fetch('/api/ffmpeg_combine_videos', {
            method: 'POST',
            body: JSON.stringify({ video_urls: videoUrls, narrations: narrations }),
        });
        if (!stitchedResponse.ok) {
            toast({
                title: "Error",
                description: "Failed to stitch videos",
                variant: "destructive"
            })
        }
        const stitchedData = await stitchedResponse.json();
        const videoFilename = stitchedData.video_filename;
        setVideoFileName(videoFilename);
        toast({
            title: "Success",
            variant: "success",
            description: "Video created successfully",
        })
        setShowShareAsPostModal(true);
        setLoadingTrailerGeneration(false);
    }

    return (
        <div className="relative md:h-screen w-full h-full top-0 flex-shrink-0
                        bg-gradient-to-b from-transparent to-transparent 
                        justify-start self-start rounded-xl mx-auto ">
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
                <div className="flex flex-col space-y-2 ">
                    <div className="md:px-4 md:p-2 px-4">
                        {/* Cover Image */}
                        <div className="min-w-[300px] h-[350px] md:h-[450px] w-full rounded-xl mx-auto md:pt-1 pt-0">
                            <div className="relative w-full h-full max-w-[350px] mx-auto min-h-[350px] rounded-xl">
                                { coverArt ?
                                    <Image
                                        src={isWebtoon ? coverArt : getImageUrl(coverArt) }
                                        alt={content.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 300px"
                                        className="object-cover rounded-xl"
                                        placeholder="blur"
                                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                    />
                                    :
                                    <Skeleton variant="rectangular" width="100%" height="100%" />
                                }
                            </div>
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

                            {/* miscellanous */}
                            <div className="flex flex-row space-x-2 text-sm">
                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                    <Eye size={11} /> {content.views}
                                </div>
                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                    {/* heart icon */}
                                    <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z" fill="#6B7280" />
                                    </svg>
                                    {content.upvotes}
                                </div>
                            </div>

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
                            <Button onClick={() => {
                                setVideoFileName('slideshow-1741598130265.mp4');
                                setShowShareAsPostModal(true);
                            }}>
                                Share as Post
                            </Button>

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

                            <div className="pb-5 w-full">
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
                                    disabled={loadingTrailerGeneration}
                                    onClick={() => {
                                        generateTrailer(content.chapters.map(chapter => chapter.id));
                                    }}
                                >
                                    <p>
                                        {loadingTrailerGeneration ? <CircularProgress size={20} /> : phrase(dictionary, "createVideo", language)}
                                    </p>
                                </Button>
                            </div>
                            {pictures && pictures.length > 0 && (
                                <div className="pb-5 w-full">
                                    {pictures.map((picture, index) => (
                                        <Image key={index} src={`data:image/png;base64,${picture}`} alt="Trailer" width={100} height={100} />
                                    ))}
                                </div>
                            )}
                            {isJongmin() &&
                                <div className="pb-5 w-full">
                                    <TranslateWebnovelAllButton language={language} webnovel={content as Webnovel} />
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
            <ShareAsToonyzPostModal
                    imageOrVideo={'video' as ImageOrVideo}
                    showShareAsPostModal={showShareAsPostModal}
                    setShowShareAsPostModal={setShowShareAsPostModal}
                    index={0}
                    videoFileName={videoFileName!}
                    webnovel_id={content.id.toString()}
                    chapter_id={content.chapters[content.chapters.length - 1]?.id.toString() || ''}
                    quote={content.title}
                />
        </div>
    );
}