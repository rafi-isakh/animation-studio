'use client'
import { Modal, Box } from "@mui/material";
import { videoStyle } from "@/styles/ModalStyles";

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: JSX.Element | null;
}

export function VideoModal({ isOpen, onClose, video }: VideoModalProps) {
    return (
        <Modal open={isOpen} onClose={onClose}>
            <Box sx={videoStyle}>
                <div className="flex flex-col space-y-4 items-center justify-center">
                    {video}
                </div>
            </Box>
        </Modal>
    );
}