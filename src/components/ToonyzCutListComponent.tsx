'use client'
import { Webnovel, Webtoon } from '@/components/Types';
import Image from 'next/image';
import { useState } from 'react';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box } from '@mui/material';
import { Button } from '@mui/material';
import { Share } from 'lucide-react';
import ToonyzCutCard from '@/components/ToonyzCutCard';
import Link from 'next/link';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

export const ToonyzCutListComponent = ({ webnovels }: { webnovels: Webnovel[] }) => {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    return (
        <>        
         
            <div className='flex flex-col items-center gap-2 mt-10'>
            <TabContext value={tabValue} >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }} className='dark:text-gray-700'>
                    <div className="flex flex-row justify-between items-center">
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs"
                            sx={{
                                width: '100%',
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
                            className={`first-line:dark:text-white 
                                         dark:focus:text-[#8A2BE2] 
                                         dark:active:text-[#8A2BE2]
                                       `}
                             >
                            <Tab 
                               label={
                                <>
                               All
                                </>
                                }
                                value="1" 
                                className="dark:text-white
                                 dark:focus:text-[#8A2BE2]
                                 dark:active:text-[#8A2BE2]
                                 md:w-auto sm:w-[10px]
                                " />
                        </TabList>
                        <div className='self-center text-sm md:w-1/3 w-full'>
                        <Link href="/toonyzcut/submit">
                            <Button
                                sx={{
                                    border: '1px solid #070B34',
                                    color: '#070B34',
                                    '&:hover': {
                                        backgroundColor: '#070B34',
                                        color: 'white',
                                    },
                                }}
                                variant="outlined"
                                className="bg-white border-2 text-black hover:text-[#8A2BE2] 
                                w-full rounded-md flex flex-row items-center gap-2 md:text-sm text-[10px]">
                              
                                    <Share size={16} />
                                    {/* Offer your proposal */}
                                    {phrase(dictionary, 'toonyzcut_offer_proposal', language)}
                                 </Button>
                             </Link>
                        </div>
                    </div>
                </Box>

                <TabPanel value="1" className='md:max-w-screen-lg w-full'>
                     <div className='grid md:grid-cols-4 grid-cols-1 gap-20'>
                       {webnovels
                       .map((webnovel: Webnovel, index: number) => (
                        <ToonyzCutCard key={index} webnovel={webnovel} />
                       ))}
                     </div>
                </TabPanel>
            </TabContext>
            </div>
        </>
    )
}