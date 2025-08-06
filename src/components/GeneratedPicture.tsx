import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ImageOrVideo } from "./Types";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, RotateCw, X, Sparkles, Share2 } from "lucide-react";
import { Dialog } from "@/components/shadcnUI/Dialog";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/shadcnUI/Textarea";
import ShareDialog from "@/components/UI/ShareDialog";

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
    const { setChapterId, setShowShareAsPostModal, setShareType, setPicture, setChosenPictures } = useCreateMedia();
    const [isEditing, setIsEditing] = useState(false);
    const { dictionary, language } = useLanguage();
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [chosen, setChosen] = useState(true);

    useEffect(() => {
        setChapterId(chapter_id);
    }, [chapter_id]);

    useEffect(() => {
        // Ensure image is in pictures only if chosen is true
        setChosenPictures(prevPictures => {
            // Remove this image from the array if it exists
            const filtered = prevPictures.filter(pic => pic !== image);
            if (chosen) {
                // If chosen is true, add it back (at the end)
                return [...filtered, image];
            } else {
                // If chosen is false, just return the filtered array
                return filtered;
            }
        });
    }, [chosen]);

    const buttonList = [
        {
            id: 'share',
            icon: <Share2 size={10} />,
            tooltipText: 'share',
            onClick: () => {
                setShareType('image');
                setPicture(image);
                setShowShareDialog(true);
            },
            className: 'bg-[#DE2B74] hover:bg-pink-400'
        },
        {
            id: 'edit',
            icon: <RotateCw size={10} />,
            tooltipText: 'editPrompt',
            onClick: () => {
                setIsEditing(true);
            },
            className: 'bg-[#4B5563] hover:bg-gray-500'
        }
    ]


    return (
        <div key={key} className="relative" onClick={() => setChosen(prev => !prev)}>
            {/* Checkbox in top left corner */}
            <div className="absolute top-2 left-2 z-[101]">
                <button
                    type="button"
                    aria-label={chosen ? "Deselect image" : "Select image"}
                    className="flex items-center justify-center w-6 h-6 rounded bg-white/80 dark:bg-black/80 border border-gray-300 dark:border-gray-700 shadow"
                    tabIndex={0}
                >
                    {chosen ? (
                        // Checked box (SVG)
                        <svg className="w-4 h-4 text-[#DE2B74]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" className="text-[#DE2B74] opacity-10"/>
                            <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        // Unchecked box (SVG)
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth={2} fill="none"/>
                        </svg>
                    )}
                </button>
            </div>
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
                    <div className="z-[99] absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center">

                        <div className="flex-1 flex items-center justify-center">
                            <Button
                                className="bg-[#DE2B74] text-white z-[999] rounded-xl"
                                onClick={() => {
                                    setShareType('image');
                                    setShowShareAsPostModal(true);
                                    setPicture(image);
                                }}
                            >
                                <Share size={10} />
                                {phrase(dictionary, "uploadToonyzPost", language)}
                            </Button>
                        </div>

                        <div className="absolute bottom-2 right-2 flex">
                            {buttonList.map((button, index) => (
                                <Tooltip key={button.id}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={button.onClick}
                                            variant="outline"
                                            size="icon"
                                            className={`rounded-full text-white border-0 
                                            ${button.className} ${index > 0 ? 'ml-2' : ''}`}
                                        >
                                            {button.icon}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {phrase(dictionary, button.tooltipText, language)}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </div>
            </TooltipProvider>
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <ShareDialog mode="shareToSocialMedia" description={`Share this image with your friends and family.`} shareImage={image} />
            </Dialog>
            {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center z-[100] select-none">
                    <div className="absolute inset-0  backdrop-blur-md z-50 rounded-lg" />
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
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline"
                                            onClick={() => setIsEditing(false)}
                                            className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        >
                                            <Sparkles size={10} />
                                            {phrase(dictionary, "edit", language)}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {phrase(dictionary, "preparing", language)}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
