import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ImageOrVideo } from "./Types";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { Button } from "@/components/shadcnUI/Button";
import { CardContent } from "@/components/shadcnUI/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, Image as ImageIcon, Clapperboard, Sparkles, Download } from "lucide-react";


export default function GeneratedPicture({
    index,
    image,
    webnovel_id,
    chapter_id,
    quote,
    makeSlideshow,
    makeVideo,
    isSelected,
}:
    {
        index: number,
        image: string,
        webnovel_id: string,
        chapter_id: string,
        quote?: string,
        makeSlideshow?: () => void,
        makeVideo?: () => void,
        isSelected?: boolean,
    }) {
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);

    useEffect(() => {
        console.log('image changed');
    }, [image]);

    const buttonList = [
        {
            id: 'share',
            icon: <Share size={10} />,
            tooltipText: 'Share',
            onClick: () => setShowShareAsPostModal(true),
            className: 'bg-[#DE2B74] hover:bg-pink-400'
        },
        {
            id: 'download',
            icon: <Download size={10} />,
            tooltipText: 'Download',
            onClick: () => {/* Your download handler */},
            className: 'bg-[#4B5563] hover:bg-gray-500'
        }
    ]
    
    return (
        <TooltipProvider delayDuration={0}>
            <div className="group border-0 flex aspect-square items-center justify-center relative">
                <Image
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    fill
                    className={`object-cover rounded-xl group-hover:scale-105 transition-all duration-300 ${isSelected ? 'border-2 border-[#DE2B74]' : 'opacity-100'}`}
                />
                <div className="z-[99] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center">
                  {buttonList.map((button, index) => (
                    <Tooltip key={button.id}>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={button.onClick}
                                variant="outline"
                                className={`rounded-full text-white border-0 
                                            ${button.className} ${index > 0 ? 'ml-2' : ''}`}
                            >
                                {button.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {button.tooltipText}
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
