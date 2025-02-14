"use client"

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import { useRef, useState } from 'react';
import Paper from '@mui/material/Paper';
import { useTheme } from "@/contexts/providers"
import { LibraryBig, LayoutGrid, SquarePlus, Bell, Gift, Search, CircleUserRound } from "lucide-react"
import { useRouter } from 'next/navigation';

export default function BottomNavigationBar() {
    const { theme } = useTheme();
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const handleNavigation = (newValue: number) => {
        setValue(newValue);
        switch (newValue) {
            case 0:
                router.push('/search');
                break;
            case 1:
                router.push('/#');
                break;
            case 2:
                router.push('/#');
                break;
            case 3:
                router.push('/stars');
                break;
            case 4:
                router.push('#');
                break;
        }
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                bgcolor: theme === 'dark' ? 'rgb(31 41 55)' : 'white' // dark:bg-gray-800
            }}
            elevation={3}
        >
            <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => handleNavigation(newValue)}
                sx={{
                    bgcolor: theme === 'dark' ? 'rgb(31 41 55)' : 'white',
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
                <BottomNavigationAction label="Search" icon={<Search />} />
                <BottomNavigationAction label="Feeds" icon={<LayoutGrid />} />
                <BottomNavigationAction label="Create" icon={<SquarePlus />} />
                <BottomNavigationAction label="Shop" icon={<Gift />} />
                <BottomNavigationAction label="Profile" icon={<CircleUserRound />} />
            </BottomNavigation>
        </Paper>
    );
}