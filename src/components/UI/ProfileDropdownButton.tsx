import * as React from 'react';
import { Dialog } from '@/components/shadcnUI/Dialog';
import { Button } from '@/components/shadcnUI/Button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/shadcnUI/Popover'
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { UserRoundX, CircleHelp, Flag, EllipsisVertical, Power } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { User } from "@/components/Types";
import ReportModal from "@/components/UI/ReportModal";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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

    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const { logout } = useAuth();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSendReportEmail = async () => {
        const message = `Reported user: ${user.nickname} - ${user.email}\n\nReport message: ${reportMessage}`;
        await fetch('/api/send_email', {
            method: 'POST',
            body: JSON.stringify({ message: message })
        });
        setShowReportModal(false);
        setShowReportSuccessModal(true);
    }

    const handleSignOut = async (event: React.FormEvent) => {
        event.preventDefault();
        logout(true, '/');
    };

    return (
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
            <Popover>
                <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
                    <Button variant="ghost" size="icon" className='!no-underline !bg-transparent'>
                        <EllipsisVertical size={20} className="dark:text-white text-gray-500" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-30 flex flex-col gap-2 !break-keep items-start justify-start">
                    {!isProfileOwner && (
                        <Link
                            href="#"
                            key="report"
                            onClick={() => {
                                setShowReportModal(true);
                                handleClose();
                            }}
                            className="flex items-center gap-2 dark:text-white text-black"
                        >
                            <Flag size={20} />
                            {phrase(dictionary, "report", language)}
                        </Link>
                    )}
                    {isProfileOwner && (
                        <div className='flex flex-col gap-2'>
                            <Link
                                href="#"
                                key="edit"
                                onClick={() => {
                                    onDeleteAccount();
                                    handleClose();
                                }}
                                className="flex items-center gap-2 dark:text-white text-black"
                            >
                                <UserRoundX size={20} />
                                {phrase(dictionary, "deleteAccount", language)}
                            </Link>
                            <Link
                                href="#"
                                key="edit"
                                onClick={(e) => {
                                    handleSignOut(e);
                                    handleClose();
                                }}
                                className="flex items-center gap-2 dark:text-white text-black"
                            >
                                <Power size={20} />
                                {phrase(dictionary, "logout", language)}
                            </Link>
                        </div>
                    )}
                    <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                        <Link
                            href="#"
                            key="help"
                            className="flex items-center gap-2 dark:text-white text-black"
                        >
                            <CircleHelp size={20} />
                            {phrase(dictionary, "help", language)}
                        </Link>
                    </Tooltip>
                </PopoverContent>
            </Popover>
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                user={user}
                onSubmit={handleSendReportEmail}
            />
        </Dialog>
    );
}