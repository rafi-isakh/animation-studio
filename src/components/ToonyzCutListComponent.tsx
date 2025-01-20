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

            <div className='flex flex-col items-center gap-4 mt-4'>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }} className='dark:text-gray-700'>
                    <div className="flex flex-row justify-end items-center mb-4">
                        <Link href="/toonyzcut/submit">
                            <Button
                                sx={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid #8A2BE2',
                                    color: '#8A2BE2',

                                    '&:hover': {
                                        backgroundColor: '#8A2BE2',
                                        color: '#fff',
                                    }
                                }}
                                className='bg-transparent border-2 text-[#8A2BE2]
                                                                       dark:text-[#8A2BE2]
                                                                       hover:text-white
                                                                       rounded-md flex flex-row items-center justify-center
                                                                       gap-2 text-sm w-full mt-2 py-2'
                            >
                                <div className='flex flex-row items-center justify-center gap-2'>

                                    <Share size={16} />
                                    {/* Offer your proposal */}
                                    {phrase(dictionary, 'toonyzcut_offer_proposal', language)}
                                </div>
                            </Button>
                        </Link>
                    </div>
                </Box >
                <div className='md:max-w-screen-lg w-full'>
                    <div className='grid md:grid-cols-4 grid-cols-1 gap-10'>
                        {webnovels
                            .map((webnovel: Webnovel, index: number) => (
                                <ToonyzCutCard key={index} webnovel={webnovel} />
                            ))}
                    </div>
                </div>
            </div >
        </>
    )
}