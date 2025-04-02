import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ImageOrVideo } from "./Types";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, RotateCw, X, Sparkles } from "lucide-react";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { Input } from "@mui/material";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/shadcnUI/Textarea";

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
    const { dictionary, language } = useLanguage();

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
                <div className="relative group border-0 flex items-center justify-center ">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl w-full h-full group">
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                            onClick={() => setShowImageModal(true)}>
                            <Image
                                src={`data:image/png;base64,${image}`}
                                alt={`Generated image ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                    <div className="absolute inset-0  backdrop-blur-md z-50 rounded-lg -z-10" />
                    <div className="flex flex-col gap-1 z-50">
                        <Textarea
                            value={quote}
                            placeholder={quote}
                            rows={11}
                            onChange={(e) => (e.target.value)}
                            className="w-full bg-white dark:bg-black text-black dark:text-white !select-none"
                        />
                        <div className="flex flex-row gap-2 justify-end">
                            <Button variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                                {phrase(dictionary, "cancel", language)}
                            </Button>
                            <Button variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                                <Sparkles size={10} />
                                {phrase(dictionary, "edit", language)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
