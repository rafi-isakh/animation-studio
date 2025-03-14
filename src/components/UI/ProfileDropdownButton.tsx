import * as React from 'react';
import { Dialog } from '@/components/shadcnUI/Dialog';
import { Button } from '@/components/shadcnUI/Button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/shadcnUI/Popover'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { Ellipsis, UserRoundX, CircleHelp, Flag, EllipsisVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { User } from "@/components/Types";
import { Textarea } from "flowbite-react";
import { useModalStyle } from "@/styles/ModalStyles";
import Image from 'next/image';
import ReportModal from "@/components/UI/ReportModal";
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

    return (
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
            <Popover>
                <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
                    <Button variant="ghost" size="icon" className='!no-underline !bg-transparent'>
                        <EllipsisVertical size={20} className="dark:text-white text-gray-500" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-30 flex flex-col gap-2 !break-keep items-start justify-start">
                        {isProfileOwner && (
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
                        )}
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