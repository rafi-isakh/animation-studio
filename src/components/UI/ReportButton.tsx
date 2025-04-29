import { phrase } from "@/utils/phrases";
import { Button } from "@/components/shadcnUI/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Textarea } from "@/components/shadcnUI/Textarea";
import { useState } from "react";
import { UserStripped } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Flag } from "lucide-react";
import Link from "next/link";
export default function ReportButton({ user, mode = "profile_page" }: { user: UserStripped, mode?: "profile_page" | "toonyzPost_page" | "comments" }) {
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const { language, dictionary } = useLanguage();
    const [reportMessage, setReportMessage] = useState('');

    const handleSendReportEmail = async () => {
        const message = `Reported user: ${user.nickname}\nUser ID: ${user.id}\n\nReport message: ${reportMessage}`;
        await fetch('/api/send_email', {
            method: 'POST',
            body: JSON.stringify({ message: message, templateType: 'Report', subject: 'Report' })
        });
        setShowReportModal(false);
        setShowReportSuccessModal(true);
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
            <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
                <DialogContent showCloseButton={true} className="bg-white dark:bg-[#211F21]">
                    <DialogHeader>
                        <DialogTitle>{phrase(dictionary, "wouldYouLikeToReport", language)}</DialogTitle>
                    </DialogHeader>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <Textarea rows={4} className='w-full p-4' placeholder={phrase(dictionary, "reportReason", language)} value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} />
                    </div>
                    <DialogFooter className='flex flex-row justify-center items-center gap-4'>
                        <Button variant='outline' className='' onClick={handleSendReportEmail}>{phrase(dictionary, "report", language)}</Button>
                        <Button color='destructive' variant='outline' className='bg-[#DE2B74] text-white' onClick={() => setShowReportModal(false)}>{phrase(dictionary, "cancel", language)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showReportSuccessModal} onOpenChange={setShowReportSuccessModal}>
                <DialogContent showCloseButton={true} className="bg-white dark:bg-[#211F21]">
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold'>{phrase(dictionary, "reportSuccess", language)}</p>
                    </div>
                    <DialogFooter className='flex flex-row !justify-center !items-center gap-4'>
                        <Button variant='outline' className='bg-[#DE2B74] text-white' onClick={() => setShowReportSuccessModal(false)}>{phrase(dictionary, "close", language)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}