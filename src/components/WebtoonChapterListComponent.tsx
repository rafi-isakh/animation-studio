'use client'
import { useState, useRef, useEffect } from "react";
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
import { Facebook, Twitter, CodeXml, Ellipsis, Flag, CircleHelp, ArrowDownUp } from "lucide-react";
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
                            className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]"
                        >
                            <Tab label={phrase(dictionary, "episodes", language)} value="1" className="dark:text-white dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />
                            {/* <Tab label={phrase(dictionary, "comments", language)} value="2" className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" /> */}
                            <Tab label={phrase(dictionary, "description", language)} value="2" className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />
                        </TabList>
                        <div className='self-center text-sm md:block hidden'>
                            <button
                                onClick={handleSortToggle}
                                className="bg-white text-black hover:text-[#8A2BE2] px-2 py-1 rounded-md flex flex-row items-center gap-2">
                                <ArrowDownUp size={16} className="text-gray-500 group-hover:text-white self-center" />
                                {phrase(
                                    dictionary,
                                    isSortedByLatest ? "sort_latest" : "sort_oldest",
                                    language
                                )}
                            </button>
                        </div>
                    </div>
                </Box>

                <TabPanel value="1">
                    <div className="flex flex-row justify-between gap-3">
                        <div className="w-full">
                            <WebtoonChapterListSubcomponent webtoon={webtoon} slug={slug} coverArt={coverArt} sortToggle={isSortedByLatest} />
                        </div>
                        <div className="flex-col space-y-4 w-1/3 md:flex hidden">
                            <WebtoonRecommendationsComponent webtoons={webtoons} coverArtUrls={coverArtUrls} />
                            <AuthorProfileCard webtoon={webtoon} />
                        </div>
                    </div>
                </TabPanel>
                {/* <TabPanel value="2">
                    comments list
                </TabPanel> */}
                <TabPanel value="2">
                    {webtoon.description}
                </TabPanel>
            </TabContext>
        </div>
    )
}


export default WebtoonChapterListComponent;