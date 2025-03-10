import * as React from 'react';
import { Box, Modal } from "@mui/material";
import { Button } from "@/components/shadcnUI/Button"
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "@/components/shadcnUI/Popover";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { Ellipsis, UserRoundX, CircleHelp, Flag, Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { User, Comment } from "@/components/Types";
import Image from 'next/image';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/shadcnUI/AlertDialog"
import { useTheme } from '@/contexts/providers'
import { useUser } from '@/contexts/UserContext';

const ITEM_HEIGHT = 48;

export default function CommentsDropdownButton({
    comment,
    user,
    email,
    handleDeleteComment,
}: {
    comment: Comment,
    user: User,
    email: string,
    handleDeleteComment: (commentId: string) => void,
}) {
    const { language, dictionary } = useLanguage();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const { id } = useUser();
    const { theme } = useTheme();
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleClick}
                >
                    <Ellipsis size={18} className='text-gray-600' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-24">
                <div className='flex flex-col gap-2'>
                    {comment.user.id.toString() === id &&
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
                </div>
            </PopoverContent>
        </Popover>
    );
}