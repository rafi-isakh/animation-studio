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
import {  Flag, CircleHelp, ArrowDownUp, List, MessageCircle, FileText, Heart } from "lucide-react";
import WebtoonRecommendationsComponent from "@/components/WebtoonRecommendationsComponent";
import AuthorProfileCard from "./AuthorProfileCard";
import moment from "moment";
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
import { ListOfChapterComments } from "@/components/ListOfChapterComments";

interface WebtoonChapterListComponentProps {
    webtoon: Webtoon;
    slug: string;
    coverArt: string;
    webtoons: Webtoon[];
    coverArtUrls: string[];
    
}

const WebtoonChapterListComponent: React.FC<WebtoonChapterListComponentProps> = ({
    webtoons,
    coverArtUrls,
    webtoon,
    slug,
    coverArt,
    
}) => {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const [isSortedByLatest, setIsSortedByLatest] = useState(true);
    const formattedDate = moment(webtoon.created_at).format('MM/DD/YYYY');
    const [currentPageUrl, setCurrentPageUrl] = useState('');

    useEffect(() => {
        if (window !== undefined) { 
            setCurrentPageUrl(window.location.href);
        }
    }, []);
 
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        webtoon.chapters = webtoon.chapters.sort((a, b) => {
            return isSortedByLatest ? b.id - a.id : a.id - b.id;
        });
    }, [isSortedByLatest, webtoon.chapters]);

    const handleSortToggle = () => {
        setIsSortedByLatest(prev => !prev);
    };

    return (
        <div className="flex flex-col gap-2 mt-10">  {/* Top tab margin 10 */}
            <TabContext value={tabValue} >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className='dark:text-gray-700'>
                    <div className="flex flex-row justify-between items-center">
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    color: 'gray', // Default tab color
                                    '&.Mui-selected': {
                                        color: '#8A2BE2', // Color when tab is selected
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#8A2BE2', // Indicator color
                                }
                            }}
                            className={`first-line:dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]
                                     `}
                             >
                            <Tab 
                               label={
                                <>
                                <span className="flex-row items-center gap-1 hidden md:flex">
                                  <List size={16} /> {phrase(dictionary, "episodes", language)}
                                </span>
                                <span className="flex flex-row items-center gap-1 md:hidden">
                                   <List size={16} /> {webtoon.chapters.length}
                                </span>
                                </>
                            }
                                value="1" 
                                className="dark:text-white dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]
                                 md:w-auto sm:w-[10px]
                                " />
                            <Tab label={
                                <>
                                <span className="flex-row items-center gap-1 hidden md:flex">
                                    <FileText size={16} /> {phrase(dictionary, "description", language)}
                                </span>
                                <span className="flex flex-row items-center gap-1 md:hidden">
                                   <FileText size={16} />   
                                </span>
                                </>
                            }
                                value="2" 
                                className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]
                                md:w-auto sm:w-[10px]
                                " />
                           <Tab label={
                             <>
                                <span className="flex-row items-center gap-1 hidden md:flex">
                                   <MessageCircle size={16} />   {phrase(dictionary, "comments", language)}
                                </span> 
                                <span className="flex flex-row items-center gap-1 md:hidden">
                                   <MessageCircle size={16} />  
                                </span>
                                </>
                            }
                                value="3" 
                                className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />

                        </TabList>
                        <div className='self-center text-sm'>
                            <Button
                                variant="text"
                                onClick={handleSortToggle}
                                className="bg-white text-black hover:text-[#8A2BE2] px-2 py-1 rounded-md flex flex-row items-center gap-2">
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

                <TabPanel value="1">
                    <div className="flex flex-row justify-between gap-3">
                        <div className="w-full">
                            <WebtoonChapterListSubcomponent webtoon={webtoon} slug={slug} coverArt={coverArt} />
                        </div>
                        <div className="flex-col space-y-10 w-1/2 md:flex hidden">
                            <WebtoonRecommendationsComponent webtoons={webtoons} coverArtUrls={coverArtUrls} />
                            <AuthorProfileCard webtoon={webtoon} />
                        </div>
                    </div>
                </TabPanel>
                <TabPanel value="2">

                    <div className="flex flex-col gap-4 space-y-4">
                      <p className="text-sm text-black dark:text-white"> {webtoon.description} </p>
                    {/* <hr /> */}
                    
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
                <TabPanel value="3">
                     {/* Comments list */}
                     {webtoon && <ListOfChapterComments content={webtoon} chapter={webtoon.chapters[0]} webnovelOrWebtoon={false}/>}
                </TabPanel>
            </TabContext>
        </div>
    )
}


export default WebtoonChapterListComponent;