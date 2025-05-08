
import { Button } from '@/components/shadcnUI/Button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/shadcnUI/Popover'
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { UserRoundX, CircleHelp, Flag, EllipsisVertical, Power } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { UserStripped } from "@/components/Types";
import ReportModal from "@/components/UI/ReportModal";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function ProfileDropdownButton({
    isProfileOwner,
    onDeleteAccount,
    user,
}: {
    isProfileOwner: boolean,
    onDeleteAccount: () => void,
    user: UserStripped
}) {
    const { language, dictionary } = useLanguage();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const { logout } = useAuth();
    const { nickname: loggedInUser_nickname, id: loggedInUser_id } = useUser();
    const { toast } = useToast();
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSendReportEmail = async () => {
        try {
            const message = `Reported user: ${user.nickname} <br/> User ID: ${user.id} <br/><br/> Reported by: ${loggedInUser_nickname} <br/> Reported by ID: ${loggedInUser_id} <br/><br/> Report message: ${reportMessage}`;
            await fetch('/api/send_email', {
                method: 'POST',
            body: JSON.stringify({  message: message, templateType: 'report', subject: 'Report - general', staffEmail: 'dami@stelland.io, min@stelland.io' })
            });
            toast({
                title: phrase(dictionary, "reportSuccess", language),
                variant: "success",
                description: phrase(dictionary, "reportSuccess_subtitle", language),
            });
            setShowReportModal(false);
            setShowReportSuccessModal(true);
        } catch (error) {
            toast({
                title: phrase(dictionary, "reportError", language),
                variant: "destructive",
                description: phrase(dictionary, "reportError_subtitle", language),
            });
        }
    }

    const handleSignOut = async (event: React.FormEvent) => {
        event.preventDefault();
        logout(true, '/');
    };

    return (
        <>
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
                    showReportModal={showReportModal}
                    setShowReportModal={setShowReportModal}
                    showReportSuccessModal={showReportSuccessModal}
                    setShowReportSuccessModal={setShowReportSuccessModal}
                    user={user}
                    reportMessage={reportMessage}
                    setReportMessage={setReportMessage}
                    onSubmit={handleSendReportEmail}
                />
        </>
    );
}