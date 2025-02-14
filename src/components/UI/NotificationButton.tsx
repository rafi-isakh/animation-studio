"use client"
import React, { useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { Button, IconButton, Popover } from '@mui/material';

interface NotificationButtonProps {
    className?: string;
    expanded: boolean;
    alert: boolean;
}

const NotificationButton = ({ className, expanded, alert }: NotificationButtonProps) => {
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
            <Button
                variant='text'
                color='gray'
                ref={buttonRef}
                onClick={handleClick}
                className={`relative flex flex-row py-2 px-6 my-1 w-full text-gray-400
                            items-center rounded-md font-medium capitalize text-base
                           hover:bg-gray-50 dark:hover:bg-black/50
                            ${open ? "bg-gray-50 dark:bg-black/50" : ""}
                            ${className}`}
            >
                <Bell className="text-gray-400" />
                <span className={`overflow-hidden transition-all text-left ${expanded ? "w-52 ml-3" : "w-0"}`}>Notifications</span>
                {alert && (
                    <div className={`absolute right-5 w-2 h-2 rounded bg-[#DE2B74] ${expanded ? "" : "top-2 right-5"}`}>
                    </div>
                )}
            </Button>
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
                    className: "dark:bg-black dark:text-white",
                    sx: {
                        zIndex: 1400
                    }
                }}
            >
                <div className="w-80 h-screen p-4 shadow-md dark:bg-black dark:text-white overflow-y-auto">
                    <div className="flex flex-row justify-between items-center">
                        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                        <IconButton onClick={handleClose} aria-label="close" className='p-0'>
                            <X className='text-black dark:text-white' />
                        </IconButton>
                    </div>
                    <hr className='my-2'/>
                    <div className="space-y-2 text-base">
                        <div className="p-2 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg">
                            <p className="text-sm">No new notifications</p>
                        </div>
                    </div>
                </div>
            </Popover>
        </>
    );
};

export default NotificationButton;