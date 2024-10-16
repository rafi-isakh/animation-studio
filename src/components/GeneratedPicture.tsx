import { Button } from "@mui/material";
import Image from "next/image";
import { useState } from "react";

export default function GeneratedPicture({ index, image }: { index: number, image: string }) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image}`;
        link.download = `generated_image_${index + 1}.png`;
        link.click();
    };

    return (
        <div
            className="w-80 h-80 relative"
        >
            <Image
                src={`data:image/png;base64,${image}`}
                alt={`Generated image ${index + 1}`}
                width={320}
                height={320}
                className="object-cover w-full h-full rounded-xl border-none"
            />
            <Button
                variant="outlined"
                color="gray"
                onClick={handleDownload}
                className="absolute bottom-2 right-2 bg-white bg-opacity-80 text-black px-3 py-1 rounded-md hover:bg-opacity-100 transition-opacity duration-200"
            >
                다운로드
            </Button>
        </div>
    )
}
