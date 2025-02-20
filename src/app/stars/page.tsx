"use client"
import { useState } from "react";
import PurchaseStarsComponent from "@/components/PurchaseStarsComponent";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { phrase } from "@/utils/phrases";
import { Box } from "@mui/material";
import StarsTransactionComponent from "@/components/StarsTransactionComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { replaceSmartQuotes } from '@/utils/font';
import { terms_purchase_stars_ko, terms_purchase_stars_english } from '@/utils/terms';

type Currency = "KRW" | "USD" | "EUR";

export interface Transaction {
    stars: number;
    price: number;
    date: string;
    currency: Currency;
}

export interface StarUse {
    user_id: number;
    stars: number;
    date: string;
}

export default function Stars() {
    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    return (
        <div className="relative md:max-w-screen-lg w-full mx-auto">
            <TabContext value={tabValue} >
                <Box sx={{ borderBottom: 0, borderColor: 'divider' }} className='dark:text-gray-700'>
                    <div className="flex flex-row justify-center items-center">
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    color: 'gray', // Default tab color
                                    '&.Mui-selected': {
                                        color: '#DB2777', // Color when tab is selected
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#DB2777', // Indicator color
                                }
                            }}
                            className={`first-line:dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#DB2777]
                                     `}
                        >
                            <Tab
                                label={phrase(dictionary, "stars", language)}
                                value="1"
                                className="dark:text-white dark:focus:text-[#DB2777] dark:active:text-[#DB2777]
                                 md:w-auto sm:w-[10px]
                                " />
                            <Tab label={phrase(dictionary, "starsTransaction", language)}
                                value="2"
                                className="dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#8A2BE2]
                                md:w-auto sm:w-[10px]
                                " />
                        </TabList>
                    </div>
                </Box>
                <TabPanel value="1">
                    <PurchaseStarsComponent />
                    {/* terms of use */}
                    <div className="md:w-[360px] w-full mx-auto text-[10px] text-left py-2 px-2 text-black dark:text-gray-500">
                        <div className='w-full whitespace-pre-wrap'>
                            {replaceSmartQuotes(language === 'ko' 
                                                ? terms_purchase_stars_ko 
                                                : terms_purchase_stars_english)}
                        </div>
                    </div>
                </TabPanel>
                <TabPanel value="2">
                    <StarsTransactionComponent />
                </TabPanel>
            </TabContext>

        </div>
    );
}