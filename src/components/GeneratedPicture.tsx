import { Box, Button, Modal } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { style } from "@/styles/ModalStyles"

export default function GeneratedPicture({ index, image }: { index: number, image: string }) {
    const [showDownloadedModal, setShowDownloadedModal] = useState(false);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image}`;
        link.download = `toonyz_${index + 1}.png`;
        link.click();
        setShowDownloadedModal(true);
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
                    onClick={handleDownload}
                    className="object-cover w-full h-full rounded-xl border-none"
                />
            </div>
            <Modal open={showDownloadedModal} onClose={() => setShowDownloadedModal(false)}>
                <Box sx={style}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        <h2>이미지가 다운로드 되었습니다.</h2>
                        <Button variant="outlined" color="gray" onClick={() => setShowDownloadedModal(false)}>닫기</Button>
                    </div>
                </Box>
            </Modal>
        </>
    )
}
