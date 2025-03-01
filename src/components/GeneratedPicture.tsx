import Image from "next/image";
import React, { useState } from "react";
import { ImageOrVideo } from "./Types";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, Image as ImageIcon, Clapperboard, Sparkles } from "lucide-react";

interface ToonyzPostMenuNavItem {
    icon: React.ReactNode;
    label: string;
    type: 'normal' | 'blob';
}

export default function GeneratedPicture({
    index,
    image,
    webnovel_id,
    chapter_id,
    quote,
    makeSlideshow,
    makeVideo
}:
    {
        index: number,
        image: string,
        webnovel_id: string,
        chapter_id: string,
        quote?: string,
        makeSlideshow: () => void,
        makeVideo: () => void
    }) {
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);

    const ToonyzPostMenuNavItems: ToonyzPostMenuNavItem[] = [
        { icon: <Share size={10} />, label: 'Share', type: 'normal' },
        { icon: <ImageIcon size={10} />, label: 'Make Slideshow', type: 'normal' },
        { icon: <Clapperboard size={10} />, label: 'Make Video', type: 'normal' },
    ];

    // Get handler function based on button label
    const getButtonHandler = (label: string) => {
        switch (label) {
            case 'Share': 
                return () => setShowShareAsPostModal(true);
            case 'Make Slideshow': 
                return makeSlideshow;
            case 'Make Video': 
                return makeVideo;
            default: 
                return () => {};
        }
    };

    // Get button color based on label
    const getButtonColor = (label: string) => {
        return label === 'Share' ? 'bg-[#DE2B74]' : 'bg-pink-600';
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className="group relative w-80 h-80 select-none "
            >
                <Image
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    width={320}
                    height={320}

                    className=" object-cover w-full h-full rounded-xl border-none group-hover:opacity-50 transition-opacity duration-300"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {ToonyzPostMenuNavItems.map((item, idx) => (
                        <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={getButtonHandler(item.label)}
                                    variant="outline"
                                    className={`group/${item.label.toLowerCase().replace(' ', '')} rounded-full ${getButtonColor(item.label)} text-white hover:bg-pink-400 border-0`}
                                >
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
                                    {/* <span className={`text-sm hidden group-hover/${item.label.toLowerCase().replace(' ', '')}:block`}>
                                        {item.label}
                                    </span> */}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>

            <ShareAsToonyzPostModal
                imageOrVideo={'image' as ImageOrVideo}
                showShareAsPostModal={showShareAsPostModal}
                setShowShareAsPostModal={setShowShareAsPostModal}
                index={index}
                image={image}
                webnovel_id={webnovel_id}
                chapter_id={chapter_id}
                quote={quote!}
            />
        </TooltipProvider>
    )
}
