import * as React from 'react';
import { Box, Button, Modal } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { Ellipsis, UserRoundX, CircleHelp, Flag, Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { User, Comment } from "@/components/Types";
import { Textarea } from "flowbite-react";
import { useModalStyle } from "@/styles/ModalStyles";
import Image from 'next/image';
import { useTheme } from '@/contexts/providers'

const ITEM_HEIGHT = 48;

export default function CommentsDropdownButton({
    comment,
    user,
    email,
    createEmailHash,
    handleDeleteComment,
}: {
    comment: Comment,
    user: User,
    email: string,
    createEmailHash: (email: string) => string,
    handleDeleteComment: (commentId: string) => void,
}) {
    const { language, dictionary } = useLanguage();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const { theme } = useTheme();
    const [showReportModal, setShowReportModal] = useState(false);

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
                <Ellipsis size={18} className='text-gray-600' />
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
                            border: '1px solid #e5e7eb',
                            backgroundColor: theme === 'dark' ? 'black' : 'white',
                        },
                    },
                }}
            >

                {comment.user.email_hash === createEmailHash(email) &&
                    <MenuItem
                        key="delete"
                        onClick={() => {
                            handleDeleteComment(comment.id.toString());
                            handleClose();
                        }}
                        className='flex items-center gap-2 dark:text-white text-black
                                 dark:group-hover/user-dropdown:text-black'>
                        <Trash size={20} className="dark:text-white text-black" />
                        {phrase(dictionary, "delete", language)}
                    </MenuItem>
                }

                <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                    <MenuItem
                        key="report"
                        className="flex items-center gap-2 dark:text-white
                                 text-black dark:group-hover/user-dropdown:text-black"
                    >
                        <Flag size={20} className="dark:text-white text-black" />
                        {phrase(dictionary, "report", language)}
                    </MenuItem>
                </Tooltip>
            </Menu>
        </div>
    );
}