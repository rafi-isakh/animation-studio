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
                            <AlertDialogContent className="dark:bg-[#211F21] bg-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{phrase(dictionary, "confirmDeleteComments", language)}</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        {phrase(dictionary, "cancel", language)}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            handleDeleteComment(comment.id.toString());
                                            setShowDeleteModal(false);
                                        }}>
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