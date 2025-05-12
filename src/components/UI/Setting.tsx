'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/shadcnUI/Button';
import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    RadioGroup,
    Radio,
    FormControlLabel
} from '@mui/material';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/shadcnUI/Dialog';
import { langPairList } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Settings } from 'lucide-react'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import { useTheme } from '@/contexts/providers';
import { Language } from '@/components/Types';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Setting({ isLoggedInAndRegistered, expanded, }
    : { isLoggedInAndRegistered: boolean, expanded: boolean, }) {
    const { language, dictionary, setLanguageOverride } = useLanguage();
    const { theme, toggleTheme } = useTheme()
    const { logout } = useAuth();
    const { email, nickname } = useUser();
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);
    const [openLanguageDialog, setOpenLanguageDialog] = useState(false);

    const handleClickLanguageDialog = () => {
        setOpenLanguageDialog(true);
    };

    const handleCloseLanguageDialog = () => {
        setOpenLanguageDialog(false);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setPopoverAnchor(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setPopoverAnchor(null);
    };

    const handleSignOut = async (event: React.FormEvent) => {
        event.preventDefault();
        logout(true, '/');
    };

    const open = Boolean(popoverAnchor);
    const id = open ? 'simple-popover' : undefined;

    return (
        <div className="flex items-center justify-center">
            <Tooltip
                arrow
                title="Settings"
                placement="right"
                slotProps={{
                    popper: {
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, -14],
                                },
                            },
                        ],
                        [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]:
                        {
                            margin: '0px',
                        },
                    },
                }}>
                <Button
                    variant='link'
                    aria-describedby={id}
                    onClick={handleClick}
                    className={`flex flex-row py-2 px-6 my-1 w-full items-center font-medium
                                 capitalize text-gray-400 text-base justify-center
                                 hover:bg-gray-50 dark:hover:bg-black/50 !no-underline
                                 `}>
                    <Settings className={`!w-5 !h-5 text-gray-400 self-center ${expanded ? "mx-auto" : "mx-auto"}`} />
                    {expanded && (
                        <span className={`overflow-hidden transition-all text-left capitalize text-gray-400 ${expanded ? "w-52 ml-1" : " w-0"}`}>
                            {phrase(dictionary, 'setting', language)}
                        </span>
                    )}
                </Button>
            </Tooltip>
            <Popover
                id={id}
                open={open}
                anchorEl={popoverAnchor}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                className={`dark:bg-black/50 transition-all duration-300`}
            >
                <Box
                    sx={{ bgcolor: `${theme === 'dark' ? 'black' : 'white'}` }}
                    className='flex flex-col md:w-52 w-full p-4 justify-start items-start text-left'>
                    <List component="div" role="group" className='flex flex-col gap-y-4 justify-start items-start w-full text-gray-500 dark:text-white text-left' >
                        <ListItemButton
                            color='gray'
                            onClick={() => toggleTheme(theme == 'dark' ? 'light' : 'dark')}
                            className='w-full hover:bg-gray-50 dark:hover:bg-[#272727] self-start text-left rounded-md'
                        >
                            {theme === 'dark' ? <Sun className=" w-6 h-6 mr-1" /> : <Moon className=" w-6 h-6 mr-1" />}{'  '}
                            <ListItemText primary={phrase(dictionary, theme === 'dark' ? 'LightMode' : 'DarkMode', language)} />
                        </ListItemButton>
                        <ListItemButton
                            color='gray'
                            aria-haspopup="true"
                            aria-controls="language-menu"
                            aria-label="Language"
                            onClick={handleClickLanguageDialog}
                            className='w-full hover:bg-gray-50 dark:hover:bg-[#272727] self-start text-left rounded-md dark:text-white'
                        >
                            <ListItemText
                                primary={phrase(dictionary, 'language', language)}
                                secondary={langPairList.find(langPair => langPair.code === language)?.name || 'English'}
                                sx={{
                                    '& .MuiListItemText-secondary': {
                                        color: 'dark:text-gray-500'
                                    }
                                }}
                                className='dark:text-white'
                                secondaryTypographyProps={{
                                    className: 'dark:text-gray-500'
                                }}
                            />
                        </ListItemButton>
                        <Link href="/faq" passHref className='w-full hover:bg-gray-50 dark:hover:bg-[#272727] self-start text-left rounded-md'>
                            <ListItemButton color='gray'>
                                <ListItemText primary={phrase(dictionary, 'helpCenter', language)} />
                            </ListItemButton>
                        </Link>
                        {!isLoggedInAndRegistered ? (
                            <Link href="/signin" passHref className='w-full hover:bg-gray-50 dark:hover:bg-[#272727] self-start text-left rounded-md'>
                                <ListItemButton color='gray'>
                                    <ListItemText primary={phrase(dictionary, 'login', language)} />
                                </ListItemButton>
                            </Link>
                        ) : (
                            <Link href="#" onClick={handleSignOut} passHref className='w-full hover:bg-gray-50 dark:hover:bg-[#272727] self-start text-left rounded-md'>
                                <ListItemButton color='gray'>
                                    <ListItemText primary={phrase(dictionary, 'logout', language)} />
                                </ListItemButton>
                            </Link>
                        )
                        }
                        <LanguageSettingDialogRaw
                            openLanguageDialog={openLanguageDialog}
                            setOpenLanguageDialog={setOpenLanguageDialog}
                            onPopoverClose={handlePopoverClose}
                        />
                    </List>
                </Box>
            </Popover>
        </div>
    )
}

export function LanguageSettingDialogRaw({ openLanguageDialog, setOpenLanguageDialog, onPopoverClose }: { openLanguageDialog: boolean, setOpenLanguageDialog: (open: boolean) => void, onPopoverClose: () => void }) {
    const radioGroupRef = useRef<HTMLElement>(null);
    const { dictionary, language, setLanguageOverride } = useLanguage();
    const { theme } = useTheme();

    const handleEntering = () => {
        if (radioGroupRef.current != null) {
            radioGroupRef.current.focus();
        }
    };

    const handleCancel = () => {
        setOpenLanguageDialog(false);
        onPopoverClose();
    };

    const handleOk = () => {
        setOpenLanguageDialog(false);
        onPopoverClose();
    };

    return (
        <Dialog open={openLanguageDialog} onOpenChange={setOpenLanguageDialog}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-full select-none' showCloseButton>
                <DialogHeader className='p-4'>
                    <DialogTitle>{phrase(dictionary, 'language', language)}</DialogTitle>
                    <DialogDescription>
                        <p className='text-sm text-gray-500 dark:text-white'>
                            {phrase(dictionary, 'setting_language_description', language)}
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col px-4 pb-4">
                    <RadioGroup
                        ref={radioGroupRef}
                        aria-label="Language"
                        name="Language"
                        value={langPairList.find(langPair => langPair.code === language)?.name || 'English'}
                        onChange={(event, value) => setLanguageOverride(langPairList.find(langPair => langPair.name === value)?.code as Language)}
                        className='dark:text-white'
                    >
                        {langPairList.map((langPair) => (
                            <FormControlLabel
                                value={langPair.name}
                                key={langPair.code}
                                control={
                                    <Radio
                                        sx={{
                                            color: `${theme === 'dark' ? 'rgb(156 163 175)' : 'rgb(229 231 235)'}`,  // gray-400 in light mode
                                            '&.Mui-checked': {
                                                color: `${theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(156 163 175)'}`,  // gray-200 in dark mode
                                            },
                                        }}
                                    />
                                }
                                label={langPair.name}
                                className='dark:text-white'
                            />
                        ))}
                    </RadioGroup>
                </div>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
                    <Button
                        onClick={handleOk}
                        className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {phrase(dictionary, 'ok', language)}
                    </Button>
                    <Button
                        onClick={handleCancel}
                        className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}

                    >
                        {phrase(dictionary, 'cancel', language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}