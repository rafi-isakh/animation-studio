import { phrase } from "@/utils/phrases";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { useState } from "react";
import { UserStripped } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Flag } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import ReportModal from "@/components/UI/ReportModal";
import { useToast } from "@/hooks/use-toast";

export default function ReportButton({ user, mode = "profile_page" }: { user: UserStripped, mode?: "profile_page" | "toonyzPost_page" | "comments" }) {
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const { language, dictionary } = useLanguage();
    const [reportMessage, setReportMessage] = useState('');
    const { nickname: loggedInUser_nickname, id: loggedInUser_id } = useUser();
    const { toast } = useToast();

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
    
    return (
        <>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {mode === 'profile_page' ? (
                            <Button variant="ghost" size="icon" className="!no-underline rounded-full" onClick={() => setShowReportModal(true)}>
                                <Flag className='cursor-pointer' size={20} />
                            </Button>
                        ) : mode === 'toonyzPost_page' ? (
                            <Link href="#" onClick={() => setShowReportModal(true)} className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
                                <Flag size={10} className="dark:text-white text-gray-500" />
                                {phrase(dictionary, "report", language)}
                            </Link>
                        ) : <Link href="#" onClick={() => setShowReportModal(true)} className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
                                <Flag size={10} className="dark:text-white text-gray-500" />
                                {phrase(dictionary, "report", language)}
                            </Link>
                        }
                    </TooltipTrigger>
                    <TooltipContent>
                        {phrase(dictionary, "report", language)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
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
    )
}