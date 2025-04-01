import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ImageOrVideo } from "./Types";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, RotateCw } from "lucide-react";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { Input } from "@mui/material";

export default function GeneratedPicture({
    index,
    image,
    webnovel_id,
    chapter_id,
    quote,
    makeSlideshow,
    makeVideo,
    key
}: {
    index: number,
    image: string,
    webnovel_id: string,
    chapter_id: string,
    quote?: string,
    makeSlideshow?: () => void,
    makeVideo?: () => void,
    key: number
    }) {
    const [showImageModal, setShowImageModal] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const { setChapterId, setShowShareAsPostModal, setShareType, setPicture } = useCreateMedia();
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setChapterId(chapter_id);
    }, [chapter_id]);

    const buttonList = [
        {
            id: 'post',
            icon: <Share size={10} />,
            tooltipText: 'Post to Toonyz',
            onClick: () => {
                setShareType('image');
                setShowShareAsPostModal(true);
                setPicture(image);
            },
            className: 'bg-[#DE2B74] hover:bg-pink-400'
        },
        {
            id: 'edit',
            icon: <RotateCw size={10} />,
            tooltipText: 'Edit Prompt',
            onClick: () => {
                setIsEditing(true);
            },
            className: 'bg-[#4B5563] hover:bg-gray-500'
        }
    ]

    return (
        <div key={key} className="relative">
            <TooltipProvider delayDuration={0}>
                <div className="relative group border-0 flex aspect-square items-center justify-center ">
                    <div className="relative aspect-square w-full h-full group overflow-hidden rounded-xl">
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                            onClick={() => setShowImageModal(true)}>
                            <Image
                                src={`data:image/png;base64,${image}`}
                                alt={`Generated image ${index + 1}`}
                                fill
                                className={`object-cover rounded-xl group-hover:scale-105 transition-all duration-300`}
                            />
                        </Button>
                    </div>
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
            </TooltipProvider>
            {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center z-[100] select-none">
                    <Input
                        value={quote}
                        placeholder={quote}
                        onChange={(e) => (e.target.value)}
                    />
                </div>
            )}
        </div>
    )
}
