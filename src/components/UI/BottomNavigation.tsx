"use client"

import { useEffect, useRef, useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import Paper from '@mui/material/Paper';
import { useTheme } from "@/contexts/providers"
import { Home, LayoutGrid, Gift, Search, Star } from "lucide-react"
import { useRouter } from 'next/navigation';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { usePathname } from 'next/navigation';

export default function BottomNavigationBar() {
    const { theme } = useTheme();
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { dictionary, language } = useLanguage();
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
    const pathname = usePathname();

    const handleNavigation = (newValue: number) => {
        setValue(newValue);
        switch (newValue) {
            case 0: // menu 1
                router.push('/?version=premium');
                setIsMobileMenuOpen(false);
                break;
            case 1: // menu 2
                router.push('/explore');
                setIsMobileMenuOpen(false);
                break;
            case 2: // menu 3
                router.push('/feeds');
                setIsMobileMenuOpen(false);
                break;
            case 3: // menu 4
                router.push('/search');
                setIsMobileMenuOpen(false);
                break;
            case 4: // menu 5
                router.push('/stars');
                setIsMobileMenuOpen(false);
                break;
        }
    };

    const hideBottomNavigationInPages = () => {
        if (/^\/view_webnovels\/\d+\/chapter_view/.test(pathname)) { // hide bottom navigation in chapter view
            return "hidden"
        }
        return ""
    }

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2100,
                bgcolor: theme === 'dark' ? '#211F21' : 'white' // darkmode bg-[#211F21]
            }}
            elevation={3}
            className={hideBottomNavigationInPages()}
        >
            <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => handleNavigation(newValue)}
                sx={{
                    bgcolor: theme === 'dark' ? '#211F21' : 'white',
                    "& .Mui-selected": {
                        "& .MuiBottomNavigationAction-label": {
                            color: '#DE2B74', // #DE2B74
                        },
                        "& .MuiSvgIcon-root, & svg": {
                            color: '#DE2B74', // #DE2B74
                        }
                    },
                    "& .MuiBottomNavigationAction-label": {
                        color: theme === 'dark' ? 'rgb(209 213 219)' : 'rgb(107 114 128)', // dark:gray-300 : gray-500
                    },
                    "& .MuiSvgIcon-root, & svg": {
                        color: theme === 'dark' ? 'rgb(209 213 219)' : 'rgb(107 114 128)', // dark:gray-300 : gray-500
                    }
                }}
            >
                <BottomNavigationAction label={phrase(dictionary, "home", language)} icon={<Home />} />
                <BottomNavigationAction label={phrase(dictionary, "features", language)} icon={<Star />} />
                <BottomNavigationAction label={phrase(dictionary, "feeds", language)} icon={<LayoutGrid />} />
                <BottomNavigationAction label={phrase(dictionary, "search", language)} icon={<Search />} />
                <BottomNavigationAction label={phrase(dictionary, "shop", language)} icon={<Gift />} />
            </BottomNavigation>
        </Paper>
    );
}