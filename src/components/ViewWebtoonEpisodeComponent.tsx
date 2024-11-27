'use client'
import { useState } from "react";
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
import WebtoonChapterList from "@/components/WebtoonChapterList";

interface ViewWebtoonEpisodeComponentProps {
    webtoon: {
        title: string;
        description: string;
        chapters: WebtoonChapter[];
        user: { 
            username: string;
        };
      };
      slug: string; 
      coverArt: string;
    }

const ViewWebtoonEpisodeComponent: React.FC<ViewWebtoonEpisodeComponentProps> = ({ 
    webtoon, 
    slug,
    coverArt
}) => {
    const [tabValue, setTabValue] = useState('1');
    const {dictionary, language} = useLanguage();
    const [showMoreChapters, setShowMoreChapters] = useState(false);

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    return (
            <div className="flex flex-col gap-2">
                    <TabContext value={tabValue} >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className='dark:text-gray-700'>
                     <div className="flex flex-row justify-between items-center">
                        <TabList onChange={handleChange} aria-label="lab API tabs" textColor="secondary" indicatorColor="secondary" className="dark:text-white  dark:focus:text-purple-500 dark:active:text-purple-500 ">
                            <Tab label={phrase(dictionary, "episodes", language)} value="1" className="dark:text-white dark:focus:text-purple-500 dark:active:text-purple-500" />              
                            <Tab label={phrase(dictionary, "comments", language)} value="2" className="dark:text-white  dark:focus:text-purple-500 dark:active:text-purple-500" />
                            <Tab label={phrase(dictionary, "description", language)} value="3" className="dark:text-white  dark:focus:text-purple-500 dark:active:text-purple-500" />
                        </TabList>
                        <div className='self-center text-sm md:block hidden'>
                           <button className="bg-purple-500 text-white px-2 py-1 rounded-md">Read the first episode </button>
                        </div>
                    </div>
                    </Box>

                    <TabPanel value="1">
                        
                    <div className="flex flex-row justify-between gap-3">
                       <div className="w-full">
                            <WebtoonChapterList webtoon={webtoon} slug={slug} coverArt={coverArt} />
                         
                        </div>

                        <div className="flex-col w-1/3 md:flex hidden">
                            <h1 className="text-sm">You might like this </h1>
                           
                           

                            <div>
                                {/* profile card  */}
                                <div className="flex flex-col gap-2 justify-center items-center">
                                    <div className="rounded-full w-30 h-30 bg-gray-300 font-extrabold"> 
                                        {" "}
                                    </div >
                                   {webtoon.user.username && <p>by{webtoon.user.username}</p>}
                                    by Author
                                    <button className="border-2 border-gray-500 bg-white text-black px-2 py-1 rounded-md"> +Follow </button>
                                </div>
                            </div>

                        </div>

                    </div>


                    </TabPanel>
                    <TabPanel value="2">
                            comments list
                    </TabPanel>
                    <TabPanel value="3">
                            {webtoon.description}
                    </TabPanel>
                    </TabContext>

              

            </div>
    )
}   


export default ViewWebtoonEpisodeComponent;