import * as React from 'react';
import { Box, Button, Modal } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { Ellipsis, UserRoundX, CircleHelp, Flag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { User } from "@/components/Types";

// const options = [
//   'None',
//   'Atria',
//   'Callisto',
// ];

const ITEM_HEIGHT = 48;

export default function ProfileDropdownButton({
    isProfileOwner,
    onDeleteAccount,
    user,
}: {
    isProfileOwner: boolean,
    onDeleteAccount: () => void,
    user: User
}) {
    const { language, dictionary } = useLanguage();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <Ellipsis size={18} />
            </IconButton>
            <Menu
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        style: {
                            maxHeight: ITEM_HEIGHT * 4.5,
                            width: '20ch',
                        },
                    },
                }}
            >
                {isProfileOwner && (
                    <MenuItem
                        key="edit"
                        onClick={onDeleteAccount}
                        className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black"
                    >
                        <UserRoundX size={20} />
                        {phrase(dictionary, "deleteAccount", language)}
                    </MenuItem>
                )}
                {!isProfileOwner && (
                    <MenuItem
                        key="report"
                        className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black"
                    >
                        <Flag size={20} />
                        {phrase(dictionary, "report", language)}
                    </MenuItem>
                )}
                <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                    <MenuItem
                        key="help"
                        className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black"
                    >
                        <CircleHelp size={20} />
                        {phrase(dictionary, "help", language)}
                    </MenuItem>
                </Tooltip>
            </Menu>
        </div>
    );
}