"use client";

import Image from "next/image";

export default function WebtoonImageComponent(props: { image: string, width: number, height: number }) {

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
    };

    return (
        <Image
            src="/placeholder.png"
            loader={() => props.image}
            alt="webtoon"
            objectFit="contain"
            width={props.width}
            height={props.height}
            onContextMenu={handleContextMenu}
        />
    );
}
