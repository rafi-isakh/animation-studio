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
import { Webtoon } from "@/components/Types";
import Link from "next/link";
import { WebtoonChapter } from "@/components/Types";
import WebtoonChapterListSubcomponent from "@/components/WebtoonChapterListSubcomponent";
import { Facebook, Twitter, CodeXml, Ellipsis, Flag, CircleHelp, ArrowDownUp, List, MessageCircle, FileText } from "lucide-react";
import WebtoonRecommendationsComponent from "@/components/WebtoonRecommendationsComponent";
import AuthorProfileCard from "./AuthorProfileCard";

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
    coverArt
}) => {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const [isSortedByLatest, setIsSortedByLatest] = useState(true);

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

                    <hr />

                    <div className="flex flex-col gap-2">
                    <p className="text-sm text-black dark:text-white font-bold"> 지원 언어 </p>
                   
                    <p className="text-sm capitalize">
                        {/* {webtoon.language.toLowerCase()} */}
                        {phrase(dictionary, webtoon.language.toLowerCase(), language)}
                    </p>
                               
                   <hr />
                                {/* Genre part */}
                             
                              
                              <div></div>
                                <p className=' flex items-center'>
                                    <i className="fa-regular fa-heart mr-1"></i> {webtoon.upvotes}
                                </p>
                                <p className=' flex items-center'>
                                    <i className="fa-solid fa-eye mr-1"></i> {webtoon.views}
                                </p>
                                <p className=' flex items-center'>
                                    <i className="fa-solid fa-list mr-1"></i>
                        
                                    {webtoon.chapters.length}
                                  
                                </p>
                   
                    </div>
                    </div>

                </TabPanel>
                <TabPanel value="3">
                    <p className="text-center text-gray-500"> There's no comments yet. </p>
                </TabPanel>
            </TabContext>
        </div>
    )
}


export default WebtoonChapterListComponent;