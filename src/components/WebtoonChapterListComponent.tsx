'use client'
import { useState, useRef, useEffect } from "react";
import { Button } from "@mui/material";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box } from "@mui/material";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Webtoon, Comment } from "@/components/Types";
import Link from "next/link";
import { WebtoonChapter } from "@/components/Types";
import WebtoonChapterListSubcomponent from "@/components/WebtoonChapterListSubcomponent";
import { Flag, CircleHelp, ArrowDownUp, List, MessageCircle, FileText, Heart, AlignLeft, ChevronRightIcon } from "lucide-react";
import WebtoonRecommendationsComponent from "@/components/WebtoonRecommendationsComponent";
import Image from "next/image";
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import moment from "moment";
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
import { CommentList } from "@/components/CommentList";
import { marked } from "marked";

interface WebtoonChapterListComponentProps {
    webtoon: Webtoon;
    slug: string;
    coverArt: string;
    webtoons: Webtoon[];
    coverArtUrls: string[];
    onUpdate?: (updatedContent: Webtoon) => void;
}

const WebtoonChapterListComponent: React.FC<WebtoonChapterListComponentProps> = ({
    webtoons,
    coverArtUrls,
    webtoon,
    slug,
    coverArt,
    onUpdate,
}) => {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const [isSortedByLatest, setIsSortedByLatest] = useState(false);
    const formattedDate = moment(webtoon.created_at).format('MM/DD/YYYY');
    const [currentPageUrl, setCurrentPageUrl] = useState('');
    const [markedDescription, setMarkedDescription] = useState('');

    const handleUpdate = () => {
        if (onUpdate) {
            onUpdate(webtoon);
        }
    }

    useEffect(() => {
        if (window !== undefined) {
            setCurrentPageUrl(window.location.href);
        }
        const markDescription = async () => {
            const markedDescription = await marked(webtoon.description);
            setMarkedDescription(markedDescription);
        }
        markDescription();
    }, []);

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    const handleSortToggle = () => {
        setIsSortedByLatest(prev => !prev);
    };

    return (
        <div className="flex flex-col flex-1 flex-shrink-0 w-full">  {/* Top tab margin 10 */}
            <TabContext value={tabValue} >
                <Box
                    sx={{
                        borderBottom: 0,
                        borderColor: 'divider',
                        padding: {
                            xs: '20px 10px',  // padding for mobile (<600px)
                            sm: 0          // padding for larger screens
                        }
                    }}
                    className='dark:text-gray-700'>
                    <div className="flex flex-row justify-between items-center">
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    marginLeft: '10px',
                                    padding: '0 10px',
                                    // border: '1px solid #8A2BE2',
                                    // borderRadius: '20px',
                                    color: 'gray', // Default tab color
                                    '&.Mui-selected': {
                                        color: '#DB2777', // Color when tab is selected
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: 'transparent', // Indicator color
                                }
                            }}
                            className={`first-line:dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#DB2777]`}
                        >
                            <Tab
                                label={
                                    <div className="flex flex-row items-center gap-1">
                                        <span className="flex flex-row items-center gap-1">
                                            <AlignLeft size={16} /> {phrase(dictionary, "episodes", language)}
                                        </span>
                                        <span className="">
                                            {webtoon.chapters.length}
                                        </span>
                                    </div>
                                }
                                value="1"
                                className="dark:text-white dark:focus:text-[#DB2777] dark:active:text-[#DB2777]
                                 md:w-auto sm:w-[10px]
                                " />
                            <Tab label={
                                <>
                                    <span className="flex flex-row items-center gap-1">
                                        <FileText size={16} /> {phrase(dictionary, "description", language)}
                                    </span>
                                </>
                            }
                                value="2"
                                className="dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#DB2777]
                                md:w-auto sm:w-[10px]
                                " />
                        </TabList>
                        <div className='self-center text-sm'>
                            <Button
                                sx={{
                                    color: 'gray',
                                    backgroundColor: 'transparent',
                                }}
                                variant="text"
                                onClick={handleSortToggle}
                                className="bg-transparent text-black dark:text-white 
                                            hover:text-[#DB2777] dark:hover:text-[#DB2777] 
                                            px-2 py-1 rounded-md flex flex-row items-center gap-2">
                                <ArrowDownUp size={16} className="text-gray-500 group-hover:text-white self-center" />
                                <span className="hidden md:flex">
                                    {phrase(
                                        dictionary,
                                        isSortedByLatest ? "sort_latest" : "sort_oldest",
                                        language
                                    )}
                                </span>
                            </Button>
                        </div>
                    </div>
                </Box>
                <TabPanel
                    value="1"
                    sx={{
                        height: '100%',
                        padding: {
                            xs: '16px',  // padding for mobile (<600px)
                            sm: '16px' // padding for desktop (0 horizontal padding)
                        },
                        '& .MuiTabPanel-root': {
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start'
                        }
                    }}
                >
                    <div className="flex flex-col self-start justify-start">
                        <div className="flex flex-col w-full gap-3">
                            <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                                <Button variant='text' className="flex flex-row justify-between items-center gap-2 text-sm text-black dark:text-white bg-gray-100 dark:bg-gray-900 rounded-md py-3">
                                    <p className="text-sm flex flex-row items-center gap-2">
                                        <Image
                                            src="/images/N_logo.svg"
                                            alt="Toonyz Logo"
                                            width={0}
                                            height={0}
                                            sizes="100vh"
                                            style={{
                                                height: '20px',
                                                width: '20px',
                                                padding: '2px',
                                                justifyContent: 'center',
                                                alignSelf: 'center',
                                                borderRadius: '25%',
                                                border: '1px solid #eee',
                                                backgroundColor: 'white'
                                            }}
                                        />
                                        {/* Binge On – Unlock all & Enjoy! */}
                                        {/* {phrase(dictionary, "binge_with_bulk_unlock", language)} */}


                                    </p>
                                    <ChevronRightIcon size={16} className="text-black dark:text-white" />
                                </Button>
                            </Tooltip>
                            <WebtoonChapterListSubcomponent
                                webtoon={webtoon}
                                slug={slug}
                                coverArt={coverArt}
                                sortToggle={isSortedByLatest}
                                onUpdate={handleUpdate} />
                            <h1 className="text-base font-bold">
                                {/* You might like this : recommend webtoons for desktop  */}
                                {phrase(dictionary, "youMightLikeThis", language)}
                            </h1>
                            <hr />
                            <div className="flex flex-col w-full">
                                <WebtoonRecommendationsComponent webtoons={webtoons} coverArtUrls={coverArtUrls} />
                            </div>
                            {/* Comments list */}
                            {webtoon && <CommentList content={webtoon} chapter={webtoon.chapters[0]} webnovelOrWebtoon={false} />}
                        </div>

                    </div>
                </TabPanel>
                <TabPanel
                    value="2"
                    sx={{
                        height: '100%',
                        padding: {
                            xs: '16px',  // padding for mobile (<600px)
                            sm: '16px' // padding for desktop (0 horizontal padding)
                        },
                        '& .MuiTabPanel-root': {
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start'
                        }
                    }}
                >
                    <div className="flex flex-col self-start justify-start gap-4 space-y-4">
                        <p className="text-sm text-black dark:text-white" dangerouslySetInnerHTML={{ __html: markedDescription }} />
                        <div className="flex flex-col gap-0 space-y-4">
                            <p className="text-sm text-black dark:text-white font-bold">
                                {/* 연재 시작 */}
                                {phrase(dictionary, "created_at", language)}
                            </p>
                            <p className="text-sm capitalize">
                                {/* {webtoon.language.toLowerCase()} */}
                                <p className="text-sm text-black dark:text-white"> {formattedDate} </p>
                            </p>
                            <hr />
                            <p className="text-sm text-black dark:text-white font-bold">
                                {/* 지원 언어  */}
                                {phrase(dictionary, "language", language)}
                            </p>

                            <p className="text-sm capitalize">
                                {/* {webtoon.language.toLowerCase()} */}
                                {phrase(dictionary, webtoon.language.toLowerCase(), language)}
                            </p>
                            <hr />

                            <p className="text-sm text-black dark:text-white font-bold">
                                {/* 조회수 */}
                                {phrase(dictionary, "views", language)}
                            </p>

                            <p className="text-sm capitalize">
                                {webtoon.views}
                            </p>
                            <hr />

                            <p className="text-sm text-black dark:text-white font-bold">
                                {/* 좋아요수 */}
                                {phrase(dictionary, "likes", language)}
                            </p>

                            <p className="text-sm capitalize">
                                {webtoon.upvotes}
                            </p>
                            <hr />
                            <p className="text-sm text-black dark:text-white font-bold">
                                {/* Share */}
                                {phrase(dictionary, "share", language)}
                            </p>
                            <div className="flex flex-row gap-2">
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
                    </div>
                </TabPanel>
            </TabContext>
        </div>
    )
}


export default WebtoonChapterListComponent;