"use client";

import { useMediaQuery } from "@mui/material";
import Image from "next/image";

export default function WebtoonImageComponent({ image }: { image: string }) {

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
    };

    const isMobile = useMediaQuery('(max-width: 768px)');
    const width = isMobile ? 360 : 720;

    return (
        <Image
            src="/placeholder.png"
            loader={() => image}
            alt="webtoon"
            objectFit="contain"
            onContextMenu={handleContextMenu}
            width={width}
            height={0}
        />
    );
}
