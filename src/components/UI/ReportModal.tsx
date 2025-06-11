import { Button } from "@/components/shadcnUI/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { UserStripped } from "@/components/Types";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Textarea } from "@/components/shadcnUI/Textarea";
import { cn } from "@/lib/utils";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export default function ReportModal({
    showReportModal,
    setShowReportModal,
    showReportSuccessModal,
    setShowReportSuccessModal,
    user,
    reportMessage,
    setReportMessage,
    onSubmit,
}: {
    showReportModal: boolean,
    setShowReportModal: (showReportModal: boolean) => void,
    showReportSuccessModal: boolean,
    setShowReportSuccessModal: (showReportSuccessModal: boolean) => void,
    user: UserStripped,
    reportMessage: string,
    setReportMessage: (reportMessage: string) => void,
    onSubmit: () => void,
}) {
    const { language, dictionary } = useLanguage();

    return (
        <>
            <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
                <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className='text-md p-4'>
                        <DialogTitle className="text-md text-center">
                            <p>{phrase(dictionary, "report", language)}</p>
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription className='flex flex-col items-center justify-center gap-4 p-4 text-md'>
                        <p className='text-md font-bold'>{phrase(dictionary, "wouldYouLikeToReport", language)}</p>
                        <Textarea
                            rows={4}
                            className='w-full p-4'
                            placeholder={phrase(dictionary, "reportReason", language)}
                            value={reportMessage}
                            onChange={(e) => setReportMessage(e.target.value)}
                        />
                    </DialogDescription>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            onClick={onSubmit}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {phrase(dictionary, "report", language)}
                        </Button>
                        <Button
                            onClick={() => setShowReportModal(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showReportSuccessModal} onOpenChange={setShowReportSuccessModal}>
                <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
                    <DialogHeader className='text-md p-4'>
                        <DialogTitle className="text-md">
                            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200 text-center" />
                            <p className="text-center">{phrase(dictionary, "reportSuccess", language)}</p>
                        </DialogTitle>
                    </DialogHeader>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            onClick={() => setShowReportSuccessModal(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        >
                            {phrase(dictionary, "close", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}