import { phrase } from "@/utils/phrases";

import { Box, Button, Modal } from "@mui/material";
import { useState } from "react";
import { User } from "./Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useModalStyle } from "@/styles/ModalStyles";
import { UserRoundX } from "lucide-react";

export default function BlockButton({ user }: { user: User }) {
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showBlockSuccessModal, setShowBlockSuccessModal] = useState(false);
    const { language, dictionary } = useLanguage();

    const handleSendBlockEmail = async () => {
        await fetch('/api/block_user?id=' + user.id);
        setShowBlockModal(false);
        setShowBlockSuccessModal(true);
    }

    return (
        <>
            <Button color='gray' variant='outlined' onClick={() => setShowBlockModal(true)} className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-28 flex flex-row justify-center items-center gap-1'>
                {/* report */}
                <UserRoundX size={10} />
                <span className='text-sm'>{phrase(dictionary, "block", language)}</span>
            </Button>
            <Modal open={showBlockModal} onClose={() => setShowBlockModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        {/* Report */}
                        <p className='text-lg font-bold'>{phrase(dictionary, "wouldYouLikeToBlock", language)}</p>
                        <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={handleSendBlockEmail}>{phrase(dictionary, "block", language)}</Button>
                        <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowBlockModal(false)}>{phrase(dictionary, "cancel", language)}</Button>
                    </div>
                </Box>
            </Modal>
            <Modal open={showBlockSuccessModal} onClose={() => setShowBlockSuccessModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold'>{phrase(dictionary, "blockSuccess", language)}</p>
                    </div>
                </Box>
            </Modal>
        </>
    )
}