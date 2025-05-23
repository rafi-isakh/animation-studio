import * as React from 'react';
import { Button } from "@/components/shadcnUI/Button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/shadcnUI/Popover";
import { Ellipsis, Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { User, Comment } from "@/components/Types";
import Link from 'next/link';
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
import { useUser } from '@/contexts/UserContext';
import { createEmailHash } from '@/utils/cryptography'
import ReportButton from '@/components/UI/ReportButton';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
    const { isLoggedIn } = useAuth();
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
            <PopoverContent className="w-fit">
                <div className='flex flex-col gap-2'>
                    {comment.user.email_hash === createEmailHash(email) &&
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Link
                                    href="#"
                                    key="delete"
                                    onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                                    className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                                    <Trash size={10} className="dark:text-white text-gray-500" />
                                    {phrase(dictionary, "delete", language)}
                                </Link>
                            </AlertDialogTrigger>
                            <AlertDialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md'>
                                <AlertDialogHeader className="text-md p-4">
                                    <AlertDialogTitle className="text-md text-center">
                                        {phrase(dictionary, "confirmDeleteComments", language)}
                                    </AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                                    <AlertDialogCancel
                                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                                    >
                                        {phrase(dictionary, "cancel", language)}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            handleDeleteComment(comment.id.toString());
                                            setShowDeleteModal(false);
                                        }}
                                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}

                                    >
                                        {phrase(dictionary, "delete", language)}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    }
                    {isLoggedIn && user.id.toString() !== id && <ReportButton user={user} mode="comments" />}
                </div>
            </PopoverContent>
        </Popover >
    );
}