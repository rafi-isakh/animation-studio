import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ImageOrVideo } from "./Types";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { Button } from "@/components/shadcnUI/Button";
// import { CardContent } from "@/components/shadcnUI/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Share, Image as ImageIcon, Clapperboard, Sparkles, ArrowLeft, Download, Heart, MoreHorizontal, Edit, Video, BookMarked } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger } from "@/components/shadcnUI/Dialog";

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
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        console.log('image changed');
    }, [image]);

    const buttonList = [
        {
            id: 'post',
            icon: <Share size={10} />,
            tooltipText: 'Post to Toonyz',
            onClick: () => setShowShareAsPostModal(true),
            className: 'bg-[#DE2B74] hover:bg-pink-400'
        },
        {
            id: 'download',
            icon: <Download size={10} />,
            tooltipText: 'Download',
            onClick: () => {/* Your download handler */ },
            className: 'bg-[#4B5563] hover:bg-gray-500'
        }
    ]

    return (
        <div key={key} className="relative">
            <TooltipProvider delayDuration={0}>
                <div className="relative group border-0 flex aspect-square items-center justify-center ">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                        onClick={() => setShowImageModal(true)}>
                        <Image
                            src={`data:image/png;base64,${image}`}
                            alt={`Generated image ${index + 1}`}
                            fill
                            className={`object-cover rounded-xl group-hover:scale-105 transition-all duration-300`}
                        />
                    </Button>
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
            {/* Full screen image modal */}
            <Dialog open={showImageModal} onOpenChange={() => setShowImageModal(false)}>
                <DialogContent className="max-w-none w-full h-screen p-0 border-none bg-slate-900/95" showCloseButton={false}>
                    {/* Top navigation bar */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
                        <DialogHeader>
                            <DialogTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-slate-800/50 rounded-full"
                                //   onClick={() => setShowImageModal(false)}
                                >
                                    <ArrowLeft className="h-6 w-6" />
                                </Button>

                            </DialogTitle>
                        </DialogHeader>

                        {/* <div className="flex-1 overflow-auto px-4">
                  <div className="flex gap-2 justify-center">
                    {images.map((thumbSrc, thumbIndex) => (
                      <button
                        key={thumbIndex}
                        className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                          thumbIndex === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                        onClick={() => setCurrentImageIndex(thumbIndex)}
                      >
                        <Image
                          src={thumbSrc || "/placeholder.svg"}
                          alt={`Thumbnail ${thumbIndex + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div> */}

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800/50 rounded-full">
                                <Heart className="h-6 w-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800/50 rounded-full">
                                <Download className="h-6 w-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800/50 rounded-full">
                                <MoreHorizontal className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Main image */}
                    <div className="flex items-center justify-center h-full w-full">
                        <div className="relative max-h-[80vh] max-w-[90vw]">
                            <Image
                                src={`data:image/png;base64,${image}`}
                                alt={`Full size image ${currentImageIndex + 1}`}
                                width={1200}
                                height={1200}
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
                        <div className="flex gap-2 bg-slate-800/70 rounded-full p-2">
                            <Button variant="ghost" className="text-white hover:bg-slate-700/50 rounded-full">
                                <Edit className="h-4 w-4 mr-2" />
                                Modify...
                            </Button>
                            <Button variant="ghost" className="text-white hover:bg-slate-700/50 rounded-full">
                                <Video className="h-4 w-4 mr-2" />
                                Make Video...
                            </Button>
                            <Button variant="ghost" className="text-white hover:bg-slate-700/50 rounded-full">
                                <BookMarked className="h-4 w-4 mr-2" />
                                Reference...
                            </Button>
                            <Button variant="ghost" className="text-white hover:bg-slate-700/50 rounded-full">
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                More Like This
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Toonyz post share modal */}
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
        </div>
    )
}
