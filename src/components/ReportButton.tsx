import { phrase } from "@/utils/phrases";

import { Box, Button, Modal } from "@mui/material";
import { useState } from "react";
import { User } from "./Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "flowbite-react";
import { useModalStyle } from "@/styles/ModalStyles";
import { Flag } from "lucide-react";

export default function ReportButton({ user }: { user: User }) {
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const { language, dictionary } = useLanguage();
    const [reportMessage, setReportMessage] = useState('');

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
        <>
            <Button color='gray' variant='outlined' onClick={() => setShowReportModal(true)} className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-28 flex flex-row justify-center items-center gap-1'>
                {/* report */}
                <Flag size={10} />
                <span className='text-sm'>{phrase(dictionary, "report", language)}</span>
            </Button>
            <Modal open={showReportModal} onClose={() => setShowReportModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        {/* Report */}
                        <p className='text-lg font-bold'>{phrase(dictionary, "wouldYouLikeToReport", language)}</p>
                        <Textarea rows={4} className='w-full p-4' placeholder={phrase(dictionary, "reportReason", language)} value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} />
                        <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={handleSendReportEmail}>{phrase(dictionary, "report", language)}</Button>
                        <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowReportModal(false)}>{phrase(dictionary, "cancel", language)}</Button>
                    </div>
                </Box>
            </Modal>
            <Modal open={showReportSuccessModal} onClose={() => setShowReportSuccessModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold'>{phrase(dictionary, "reportSuccess", language)}</p>
                    </div>
                </Box>
            </Modal>
        </>
    )
}