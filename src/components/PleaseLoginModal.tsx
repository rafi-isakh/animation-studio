"use client"

import { style } from "@/styles/ModalStyles";
import { Button } from "@mui/material";
import { phrase } from "@/utils/phrases";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";
import Modal from "@mui/material/Modal";
import { useLanguage } from "@/contexts/LanguageContext";


export default function PleaseLoginModal({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={style} className="flex flex-col items-center justify-center space-y-4">
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    {phrase(dictionary, "pleaseLogin", language)}
                </Typography>
                <div className="flex flex-row space-x-4">
                    <Button variant="outlined" color="gray" onClick={() => router.push('/signin')}>
                        {phrase(dictionary, "ok", language)}
                    </Button>
                    <Button variant="outlined" color="gray" onClick={() => setOpen(false)}>
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </div>
            </Box>
        </Modal>
    )
}