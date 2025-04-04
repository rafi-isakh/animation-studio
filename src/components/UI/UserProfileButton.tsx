'use client'

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { phrase } from '@/utils/phrases'
import { User, Book, SquareLibrary, Sparkles, SquarePen, SquareUser } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from "@/utils/urls";
import { Popover } from '@mui/material';
import { IconButton } from '@mui/material';
import { X } from 'lucide-react';

const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const UserProfileButton = ({ expanded }: { expanded: boolean }) => {
    const { email, nickname, picture } = useUser();
    const { isLoggedIn } = useAuth();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const { dictionary, language } = useLanguage();
    const router = useRouter();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setOpen(false);
    };

    return (
        <>
            <Link href="#" onClick={handleClick as any} className="relative flex flex-row py-2 px-6 my-1 text-gray-400">
                {picture ?
                    <div className='relative w-8 h-8 rounded-full overflow-hidden shadow-md'>
                        <Image src={getImageUrl(picture)} alt={nickname} width={15} height={15} sizes='100vw' quality={80} className='rounded-full object-center object-cover w-full h-full' />
                    </div>
                    : <User size={20} className='text-gray-400' />
                }
                <span className={`overflow-hidden transition-all text-left ${expanded ? "w-40 ml-3" : "w-0"}`}>
                    {nickname.length > 20 ? `${nickname.slice(0, 20)}...` : nickname}
                </span>
            </Link>
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
                <div className="w-80 h-fit p-4 shadow-md dark:bg-black dark:text-white overflow-y-auto">
                    <div className="flex flex-row justify-between items-center">
                        <h3 className="text-lg font-semibold mb-2 self-center text-center">
                            <Link href="/my_profile">
                                {getTimeBasedGreeting()},{' '}
                                {nickname.length > 20 ? `${nickname.slice(0, 20)}...` : nickname}
                            </Link>
                        </h3>
                        <IconButton onClick={handleClose} aria-label="close" className='p-0 self-center'>
                            <X className='text-black dark:text-white' />
                        </IconButton>
                    </div>
                    <hr className='my-2' />
                    <div className="space-y-2 text-base">
                        <ul className="flex flex-col gap-2">
                            <li className="p-2 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg">
                                <Link href="/my_profile" onClick={() => handleClose()}>
                                    <SquareUser size={18} className='dark:text-white text-black inline-flex items-center' />
                                    <span className='ml-2 text-center'>{phrase(dictionary, "myProfile", language)}</span>
                                </Link>
                            </li>
                            <li className="p-2 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg">
                                <Link href="/my_webnovels" onClick={() => handleClose()}>
                                    <Book size={18} className='dark:text-white text-black inline-flex items-center' />
                                    <span className='ml-2 text-center'>{phrase(dictionary, "myWebnovels", language)}</span>
                                </Link>
                            </li>
                            <li className="p-2 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg">
                                <Link href="/my_library" onClick={() => handleClose()} >
                                    <SquareLibrary size={18} className='dark:text-white text-black inline-flex items-center' />
                                    <span className='ml-2 text-center'>{phrase(dictionary, "myLibrary", language)}</span>
                                </Link>
                            </li>
                            <li className="p-2 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg">
                                <Link href="/stars" onClick={() => handleClose()} >
                                    <Sparkles size={18} className='dark:text-white text-black inline-flex items-center' />
                                    <span className='ml-2 text-center'>{phrase(dictionary, "stars", language)}</span>
                                </Link>
                            </li>
                            <li className="p-2 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg">
                                <Link href="/new_webnovel" onClick={() => handleClose()}>
                                    <SquarePen size={18} className='dark:text-white text-black inline-flex items-center' />
                                    <span className='ml-2 text-center'>{phrase(dictionary, "newWebnovel", language)}</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </Popover>
        </>
    )
}

export default UserProfileButton;