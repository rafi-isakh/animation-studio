import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { Label } from "@/components/shadcnUI/Label";
import { Input } from "@/components/shadcnUI/Input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCopyToClipboard } from "@/utils/copyToClipboard";
import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import WatermarkedImage from "@/utils/watermark";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useState } from "react";

export default function ShareDialog({
    url,
    title = "Share",
    description = "Share the link with your friends and family.",
    mode = "share",
    shareImage,
    mediaType,
    webnovelTitle,
    chapterTitle
}: {
    url?: string;
    title?: string;
    description?: string;
    mode?: "share" | "shareToSocialMedia";
    shareImage?: string;
    mediaType?: 'image' | 'video';
    webnovelTitle?: string;
    chapterTitle?: string;
}) {
    const { toast } = useToast();
    const copyToClipboard = useCopyToClipboard();
    const { dictionary, language } = useLanguage();
    const [copied, setCopied] = useState(false);

    return (
        <DialogContent
            className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-[90vh] select-none text-md'
            showCloseButton={true}
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
            <DialogHeader className='text-md p-4'>
                <DialogTitle className='text-md'>{title}</DialogTitle>
                <DialogDescription className='text-md'>
                    {description}
                </DialogDescription>
            </DialogHeader>
            {mode === "share" && url ? (
                <div className="flex flex-col items-center gap-2 p-4 overflow-y-auto text-md">
                    {shareImage && (
                        mediaType === 'image' ? (
                            <div className="rounded-lg">
                                <WatermarkedImage
                                    imageUrl={getImageUrl(shareImage)}
                                    watermarkUrl="/toonyz_logo_white.svg"
                                    width={400}
                                    height={400}
                                    webnovelTitle={webnovelTitle}
                                    chapterTitle={chapterTitle}
                                    watermarkOpacity={0.2}
                                    watermarkPosition="bottomRight"
                                    titlePosition="top"
                                    titleColor="white"
                                    className="object-cover rounded-lg"
                                />
                            </div>
                        ) : mediaType === 'video' ? (
                            <div className="rounded-lg ">
                                <video src={getVideoUrl(shareImage)} width={400} height={190} playsInline muted loop autoPlay className="object-contain rounded-lg" />
                            </div>
                        ) : <Image src={getImageUrl(shareImage)} alt="Share image" width={400} height={400} className="object-contain rounded-lg" />
                    )}
                    <div className="w-full flex flex-row gap-2 text-md">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={url}
                            readOnly
                            className='select-none bg-transparent'
                            disabled
                        />
                        <Button
                            onClick={() => { copyToClipboard(url) }}
                            type="button"
                            size="sm"
                            className="px-3"
                        >
                            <span className="sr-only">Copy</span>
                            <Copy />
                        </Button>
                    </div>
                </div>) : mode === "shareToSocialMedia" ? (
                    <div className="flex items-center space-x-2 p-4 overflow-y-auto h-full text-md">
                        {shareImage && (
                            <div className="relative aspect-[9/16] overflow-hidden rounded-xl w-72 h-80 mx-auto group">
                                <Image
                                    src={`data:image/png;base64,${shareImage}`}
                                    alt={`Generated image`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className={`object-cover rounded-xl group-hover:scale-105 transition-all duration-300`}
                                />
                            </div>
                        )}
                    </div>
                ) : <></>
            }
            <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                {mode === "share" && url && <Button
                    onClick={() => { 
                        if (url) {
                            copyToClipboard(url);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }
                    }}
                    className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                >
                    {copied
                            ? phrase(dictionary, "copied", language)
                            : phrase(dictionary, "copyLink", language)
                        }
                </Button>}
                <DialogClose asChild>
                    <Button
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "close", language)}
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}