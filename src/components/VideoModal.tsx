'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog"
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils"
import { Button } from "@/components/shadcnUI/Button";
import { phrase } from "@/utils/phrases";
interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: JSX.Element | string | null;
}

export function VideoModal({ isOpen, onClose, video }: VideoModalProps) {
    const { dictionary, language } = useLanguage();
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-screen text-md" showCloseButton={true}>
                <div className="flex flex-col space-y-4 items-center justify-center text-md ">
                    {typeof video === 'string'
                        ? <iframe
                            src={video}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="w-[400px] aspect-video" />
                        : video}
                </div>

                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={onClose}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "close", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}