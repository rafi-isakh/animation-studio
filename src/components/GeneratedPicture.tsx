import Image from "next/image";
import React, { useState } from "react";
import { ImageOrVideo } from "./Types";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { Button } from "@/components/shadcnUI/Button";
import { CardContent } from "@/components/shadcnUI/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, Image as ImageIcon, Clapperboard, Sparkles } from "lucide-react";
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
        isSelected: boolean,
    }) {
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    return (
        <TooltipProvider delayDuration={0}>
            <CardContent className="group border-0 flex aspect-square items-center justify-center relative">
                <Image
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    fill
                    className={`object-cover rounded-xl group-hover:opacity-50 transition-opacity duration-300 ${isSelected ? 'border-2 border-[#DE2B74]' : 'opacity-100'}`}
                />

                <div className="z-[99] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => setShowShareAsPostModal(true)}
                                variant="outline"
                                className={`z-[99] rounded-full text-white bg-[#DE2B74] hover:bg-pink-400 border-0`}
                            >
                                <Share size={10} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Share</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </CardContent>
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
