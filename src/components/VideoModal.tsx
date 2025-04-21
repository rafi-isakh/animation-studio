'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shadcnUI/Dialog"

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: JSX.Element | string | null;
}

export function VideoModal({ isOpen, onClose, video }: VideoModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>

            <DialogContent showCloseButton={true} className="">
                <div className="flex flex-col space-y-4 items-center justify-center">
                    {typeof video === 'string'
                        ? <iframe
                            src={video}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="w-[400px] aspect-video" />
                        : video}
                </div>
            </DialogContent>
        </Dialog>
    );
}