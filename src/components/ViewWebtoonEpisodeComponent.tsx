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
        chapters: WebtoonChapter[];
      };
      slug: string;
    }

const ViewWebtoonEpisodeComponent: React.FC<ViewWebtoonEpisodeComponentProps> = ({ 
    webtoon, 
    slug 
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
                        </TabList>
                        <div className='self-center'>
                            Read

                        </div>
                    </div>
                    </Box>

                    <TabPanel value="1">
                        
                    <div className="flex flex-row justify-between">
                       <div>
                            <WebtoonChapterList webtoon={webtoon} slug={slug} />
                          {/* {webtoon.chapters.map((chapter: WebtoonChapter) =>
                            <Link href={`/webtoons/${slug}/${chapter.directory}`}>
                                <div key={`chapter-${chapter.id}`}>
                                    {chapter.directory}
                                </div>
                            </Link>
                            )} */}
                        </div>
                        <div className="flex flex-col ">
                            You might like this
                        </div>

                    </div>


                    </TabPanel>
                    <TabPanel value="2">

                     </TabPanel>
                     
                    </TabContext>

              

            </div>
    )
}   


export default ViewWebtoonEpisodeComponent;