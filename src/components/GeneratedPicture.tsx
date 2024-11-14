import { Box, Button, Modal } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { useModalStyle } from "@/styles/ModalStyles"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase} from "@/utils/phrases"

export default function GeneratedPicture({ index, image }: { index: number, image: string }) {
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const {language, dictionary} = useLanguage();

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image}`;
        link.download = `toonyz_${index + 1}.png`;
        link.click();
        setShowDownloadModal(false);
    };

    return (
        <>
            <div
                className="w-80 h-80 relative"
            >
                <Image
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    width={320}
                    height={320}
                    onClick={() => setShowDownloadModal(true)}
                    className="object-cover w-full h-full rounded-xl border-none"
                />
            </div>
            <Modal open={showDownloadModal} onClose={() => setShowDownloadModal(false)}>
                <Box sx={useModalStyle}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        <h2>{phrase(dictionary, "downloadImage", language)}</h2>
                        <Button variant="outlined" color="gray" onClick={() => handleDownload()}>{phrase(dictionary, "yes", language)}</Button>
                        <Button variant="outlined" color="gray" onClick={() => setShowDownloadModal(false)}>{phrase(dictionary, "no", language)}</Button>
                    </div>
                </Box>
            </Modal>
        </>
    )
}
