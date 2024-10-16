import { Button } from "@mui/material";
import Image from "next/image";
import { useState } from "react";

export default function GeneratedPicture({ index, image }: { index: number, image: string }) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image}`;
        link.download = `toonyz_${index + 1}.png`;
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
                onClick={handleDownload}
                className="object-cover w-full h-full rounded-xl border-none"
            />
        </div>
    )
}
