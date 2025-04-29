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
export default function ShareDialog({
    url,
    title = "Share link",
    description = "Share the link with your friends and family.",
    mode = "share",
    shareImage,
    mediaType
}: {
    url?: string;
    title?: string;
    description?: string;
    mode?: "share" | "shareToSocialMedia";
    shareImage?: string;
    mediaType?: 'image' | 'video';
}) {
    const { toast } = useToast();
    const copyToClipboard = useCopyToClipboard();

    return (
        <DialogContent
            showCloseButton={true}
            className="sm:max-w-md bg-white dark:bg-[#211F21] select-none"
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {description}
                </DialogDescription>
            </DialogHeader>
            {mode === "share" && url ? (
                <div className="flex flex-col items-center gap-2">
                    {shareImage && (
                        mediaType === 'image' ? (
                            <div className="overflow-hidden rounded-lg">
                                <WatermarkedImage
                                    imageUrl={getImageUrl(shareImage)}
                                    watermarkUrl="/toonyz_logo_white.svg"
                                    width={400}
                                    height={400}
                                    watermarkOpacity={0.2}
                                    watermarkPosition="bottomRight"
                                    titlePosition="top"
                                    titleColor="white"
                                    className="object-cover rounded-lg"
                                />
                            </div>
                        ) : mediaType === 'video' ? (
                            <div className="overflow-hidden rounded-lg">
                                <video src={getVideoUrl(shareImage)} playsInline muted loop autoPlay className="object-contain rounded-lg" />
                            </div>
                        ) : <Image src={getImageUrl(shareImage)} alt="Share image" width={130} height={190} className="object-contain rounded-lg" />
                    )}
                    <div className="w-full flex flex-row gap-2">
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
                    <div className="flex items-center space-x-2">
                        {shareImage && (
                            <div className="relative aspect-[9/16] overflow-hidden rounded-xl w-full h-full group">
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
            <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}