"use client"

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useRef, useState } from 'react';
import Paper from '@mui/material/Paper';
import { useTheme } from "@/contexts/providers"
import { LibraryBig, LayoutGrid, SquarePlus, Bell, Gift, Search, CircleUserRound } from "lucide-react"

export default function BottomNavigationBar() {
    const { theme } = useTheme();
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

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
                onChange={(event, newValue) => {
                    setValue(newValue);
                }}
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