'use client'
import { useState, useRef } from "react";
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
import Image from "next/image";

interface WebtoonChapterListComponentProps {
    webtoon: {
        title: string;
        description: string;
        chapters: WebtoonChapter[];
        user: {
            username: string;
            nickname: string;
        };
    };
    slug: string;
    coverArt: string;
}

const WebtoonChapterListComponent: React.FC<WebtoonChapterListComponentProps> = ({
    webtoon,
    slug,
    coverArt
}) => {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const [showMoreChapters, setShowMoreChapters] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isSortedByLatest, setIsSortedByLatest] = useState(true);

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(prev => !prev);
    }

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
                    <Tab label={phrase(dictionary, "comments", language)} value="2" className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />
                    <Tab label={phrase(dictionary, "description", language)} value="3" className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />
                </TabList>
                <div className='self-center text-sm md:block hidden'>
                    <button 
                    onClick={handleSortToggle}
                    className="bg-white text-black hover:text-[#8A2BE2] px-2 py-1 rounded-md flex flex-row items-center gap-2"> 
                         <ArrowDownUp size={16} className="text-gray-500 group-hover:text-white self-center"/> 
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
                    <WebtoonChapterListSubcomponent webtoon={webtoon as unknown as Webtoon} slug={slug} coverArt={coverArt} />

                </div>

                <div className="flex-col w-1/3 md:flex hidden">
                    <div className="px-5">
                    <h1 className="text-sm font-bold">
                       {/* You might like this : recommend webtoons  */}
                       {phrase(dictionary, "youMightLikeThis", language)}
                    </h1>
                        {webtoon.chapters.map((chapter: WebtoonChapter, index: number) => (
                        <Link
                            href={`/webtoons/${slug}/${chapter.directory}`}
                            key={`chapter-${chapter.id}`}
                            className={`cursor-pointer block py-2 border-gray-200 last:border-b-0 ${
                            index >= 10 && !showMoreChapters ? 'hidden' : ''
                            }`}
                        >
                            <div className="flex flex-row bg-gray-200 hover:opacity-80 transition duration-150 ease-in-out">
                               <Image 
                                src={coverArt} 
                                alt={chapter.directory} 
                                className="self-center" 
                                width={50}
                                height={50}
                                />
                                
                                <div className="flex flex-row justify-between items-center w-full">
                                    <div className="ml-3 flex flex-col gap-1">
                                        <p className="text-sm"> 
                                             Title
                                        </p>
                                        <p className="flex flex-row gap-1">
                                            <span className="text-gray-100 text-[10px] rounded-full bg-gray-800 px-1">
                                                #genre
                                            </span>
                                            <span className="text-gray-600 text-[10px] ">
                                                author
                                            </span>
                                        </p>
                                    </div>
                                    <div className="text-sm text-center self-center">
                                    {/* <LockOpen size={16} className="text-gray-200" /> */}
                                        <p className="text-gray-600 text-[10px] mr-5">
                                            {/* Free */}
                                            {phrase(dictionary, "readingForFree", language)}
                                        </p>
                                     </div>
                                 </div>

                                
                          </div>
                       </Link>
                    ))}
                   </div>

                <div>

                {/* profile card  */}
                <div className="flex flex-col gap-2 justify-center items-center mt-10">
                    <svg
                        className="w-[30px] h-[30px] text-gray-400 rounded-full bg-gray-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                    </svg>

                by Author
                {/* {webtoon.user.nickname && <p>by {webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname}</p>} */}
                <button className="border-2 border-gray-500 bg-white text-black px-2 py-1 rounded-md text-[10px] hover:opacity-80 transition duration-150 ease-in-out"> 
                    +Follow 
                </button>

                <div className="flex flex-col gap-2 justify-center items-center">
                    <span className="text-[10px] uppercase"> Share </span>
                    <button className="border-2 border-[#3C5997] bg-[#3C5997] py-1 px-1 text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                        <Facebook size={22} className="text-white" />
                    </button>
                    <button className="border-2 border-[#54ACEE] bg-[#54ACEE]  py-1 px-1  text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                        <Twitter size={22} className="text-white" />
                    </button>
                    <button className="border-2 border-gray-500 bg-gray-500  py-1 px-1  text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                        <CodeXml size={22} className="text-white" />
                    </button>

                    <li className="flex flex-col items-center justify-center list-none">
                        <button onClick={toggleUserDropdown} className="border-2 border-gray-100 bg-gray-100  py-1 px-1  text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                            <Ellipsis size={22} className="text-gray-600" />
                        </button>

                        {isUserDropdownOpen && (
                            <div id="user-dropdown" ref={userDropdownRef} className={`rounded-md md:border-0 border border-gray-400 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-32 dark:divide-gray-600`}>
                                <ul className="py-2 text-sm text-gray-700 dark:text-black" aria-labelledby="dropdownLargeButton">
                                    <li className="px-3 py-2 hover:bg-gray-200  dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                        <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                            <Flag size={20} className="dark:text-white text-black" />
                                            Report
                                        </Link>
                                    </li>
                                    <li className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                        <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                            <CircleHelp size={20} className="dark:text-white text-black" />
                                            Help
                                        </Link>
                                    </li>

                                </ul>
                            </div>
                        )}
                    </li>

                </div>
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


export default WebtoonChapterListComponent;