import * as React from 'react';
import { Box, Button, Modal } from "@mui/material";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useState } from "react";
import { UserStripped } from "@/components/Types";
import { Textarea } from "flowbite-react";
import Image from 'next/image';
import { useModalStyle } from "@/styles/ModalStyles";
import { useUser } from "@/contexts/UserContext";

export default function ReportModal({
    isOpen,
    onClose,
    user,
    onSubmit,
}: {
    isOpen: boolean,
    onClose: () => void,
    user: UserStripped,
    onSubmit: () => void,
}) {
    const { language, dictionary } = useLanguage();
    const [reportMessage, setReportMessage] = React.useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const { nickname: loggedInUser_nickname, id: loggedInUser_id } = useUser();

    const handleSendReportEmail = async () => {
        const message = `Reported user: ${user.nickname} <br/> User ID: ${user.id} <br/><br/> Reported by: ${loggedInUser_nickname} <br/> Reported by ID: ${loggedInUser_id} <br/><br/> Report message: ${reportMessage}`;
        await fetch('/api/send_email', {
            method: 'POST',
            body: JSON.stringify({ message: message, templateType: 'report', subject: 'Report', staffEmail: 'dami@stelland.io, min@stelland.io' })
        });
        setShowReportModal(false);
        setShowReportSuccessModal(true);
        onClose();
    }

    return (
        <>
            <Modal
                open={isOpen}
                onClose={onClose}
                className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
            >
                <div className="flex flex-col items-center justify-center w-[350px]">
                    <div className="relative top-[10px]">
                        <div className="w-24 h-24 bg-pink-200 rounded-full flex items-center justify-center">
                            <Image src="/stelli/stelli_7.png" alt="character" width={100} height={100} />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 relative">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center"
                        >
                            <span className="text-[#DE2B74] text-xl">&times;</span>
                        </button>

                        {/* Content Title */}
                        <div className="text-center">
                            <p className="text-xl mb-2 font-medium">{phrase(dictionary, "report", language)}</p>
                        </div>

                        <div className='flex flex-col items-center justify-center space-y-3'>
                            {/* Report */}
                            <p className='text-lg font-bold'>{phrase(dictionary, "wouldYouLikeToReport", language)}</p>
                            <Textarea rows={4} className='w-full p-4' placeholder={phrase(dictionary, "reportReason", language)} value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} />

                            <Button
                                variant='text'
                                onClick={handleSendReportEmail}
                                className="w-full py-2 bg-[#DE2B74] text-white rounded-full hover:bg-[#DE2B74]/80 transition-colors"
                            >
                                {phrase(dictionary, "report", language)}
                            </Button>
                            <Button
                                variant='outlined'
                                onClick={onClose}
                                className="w-full py-2 border-2 border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                            >
                                {phrase(dictionary, "cancel", language)}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal open={showReportSuccessModal} onClose={() => setShowReportSuccessModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold'>{phrase(dictionary, "reportSuccess", language)}</p>
                    </div>
                </Box>
            </Modal>
        </>
    );
}