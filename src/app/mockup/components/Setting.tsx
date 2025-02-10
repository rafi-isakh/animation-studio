'use client'

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Button,
    List,
    ListItemButton,
    ListItemText,
    DialogTitle,
    DialogContent,
    DialogActions,
    Dialog,
    RadioGroup,
    Radio,
    FormControlLabel
} from '@mui/material';
import { langPairList } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Settings } from 'lucide-react'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import { useTheme } from '@/contexts/providers';
import { Language } from '@/components/Types';
import { useDevice } from '@/contexts/DeviceContext';

export default function Setting() {
    const { language, dictionary, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme()
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);
    const [openLanguageDialog, setOpenLanguageDialog] = useState(false);
    const [value, setValue] = useState('English');

    const handleClickLanguageDialog = () => {
        setOpenLanguageDialog(true);
    };

    const handleCloseLanguageDialog = (newValue?: string) => {
        setOpenLanguageDialog(false);

        if (newValue) {
            setValue(newValue);
        }
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setPopoverAnchor(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setPopoverAnchor(null);
    };

    const open = Boolean(popoverAnchor);
    const id = open ? 'simple-popover' : undefined;

    return (
        <div className="flex items-center justify-center ">
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
                    variant='text'
                    aria-describedby={id}
                    onClick={handleClick}
                    className={`group flex h-14 w-full items-center justify-center group-hover:bg-gray-50 dark:group-hover:bg-gray-900`} >
                    <Settings className="h-6 w-6 text-gray-400 " />
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
                            className='w-full hover:bg-gray-50 dark:hover:bg-gray-900 self-start text-left rounded-md'
                        >
                            <ListItemText primary={phrase(dictionary, theme === 'dark' ? 'LightMode' : 'DarkMode', language)} />
                        </ListItemButton>
                        <ListItemButton
                            color='gray'
                            aria-haspopup="true"
                            aria-controls="language-menu"
                            aria-label="Language"
                            onClick={handleClickLanguageDialog}
                            className='w-full hover:bg-gray-50 dark:hover:bg-gray-900 self-start text-left rounded-md dark:text-white'
                        >
                            <ListItemText
                                primary="Language"
                                secondary={value}
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
                        <ListItemButton
                            color='gray'
                            className='w-full hover:bg-gray-50 dark:hover:bg-gray-900 self-start text-left rounded-md'
                        >
                            <ListItemText primary="Help center" />
                        </ListItemButton>
                        <LanguageSettingDialogRaw
                            id="language-menu"
                            keepMounted
                            open={openLanguageDialog}
                            onClose={handleCloseLanguageDialog}
                            value={value}
                            onPopoverClose={handlePopoverClose}
                        />
                    </List>
                </Box>
            </Popover>
        </div>
    )
}

export function LanguageSettingDialogRaw(props: {
    id: string,
    keepMounted: boolean,
    open: boolean,
    onClose: (value?: string) => void,
    value: string,
    onPopoverClose: () => void
}) {
    const radioGroupRef = useRef<HTMLElement>(null);
    const { dictionary, language, setLanguage } = useLanguage();
    const { theme } = useTheme();
    const [selectedValue, setValue] = useState(props.value);
    const { onClose, value: valueProp, open, ...other } = props;

    useEffect(() => {
        if (!props.open) {
            setValue(props.value);
        }
    }, [props.value, props.open]);


    const handleEntering = () => {
        if (radioGroupRef.current != null) {
            radioGroupRef.current.focus();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    const handleOk = () => {
        onClose(selectedValue);
        setLanguage(selectedValue as Language);
        props.onPopoverClose();
    };

    return (
        <Dialog
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
            maxWidth="xs"
            TransitionProps={{ onEntering: handleEntering }}
            open={props.open}
            {...other}
            className='dark:text-white'
            PaperProps={{
                className: "bg-white dark:bg-black dark:text-white" // or any dark color you prefer
            }}
        >
            <DialogTitle>Language</DialogTitle>
            <DialogContent dividers>
                <RadioGroup
                    ref={radioGroupRef}
                    aria-label="Language"
                    name="Language"
                    value={selectedValue}
                    onChange={(event, value) => setValue(value)}
                    className='dark:text-white'
                >
                    {langPairList.map((langPair) => (
                        <FormControlLabel
                            value={langPair.code}
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
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={handleCancel}>
                    {phrase(dictionary, 'cancel', language)}
                </Button>
                <Button onClick={handleOk}>
                    {phrase(dictionary, 'ok', language)}
                </Button>
            </DialogActions>
        </Dialog>
    );
}