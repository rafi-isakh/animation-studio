"use client"
import React, { useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { Button, IconButton, Popover } from '@mui/material';

interface NotificationButtonProps {
    className?: string;
}

const NotificationButton = ({ className }: NotificationButtonProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleClick}
                className={`flex h-14 items-center justify-center rounded-md
                hover:bg-gray-50 dark:hover:bg-black/50 w-full
                ${open ? "bg-gray-50 dark:bg-black/50" : ""}
                ${className}`}
            >
                <Bell className="h-6 w-6 text-gray-400" />
            </button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                sx={{
                    zIndex: 1400,
                    '& .MuiBackdrop-root': {
                        zIndex: 1300
                    }
                }}
                PaperProps={{
                    className: "mt-2 dark:bg-black dark:text-white",
                    sx: {
                        zIndex: 1400
                    }
                }}
            >
                <div className="w-80 h-screen p-4 shadow-md dark:bg-black dark:text-white overflow-y-auto">
                   <div className="flex flex-row justify-between items-center">
                    <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                    <IconButton onClick={handleClose} aria-label="close"  className='p-0'>
                        <X className='text-black dark:text-white'/>
                    </IconButton>
                   </div>
                    <div className="space-y-2">
                        <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <p className="text-sm">No new notifications</p>
                        </div>
                    </div>
                </div>
            </Popover>
        </>
    );
};

export default NotificationButton;