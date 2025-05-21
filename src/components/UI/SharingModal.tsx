'use client'
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/shadcnUI/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { UserStripped } from '@/components/Types';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import {
    TwitterShareButton,
    TwitterIcon,
    TelegramShareButton,
    TelegramIcon,
    WhatsappShareButton,
    WhatsappIcon,
    PinterestShareButton,
    PinterestIcon,
} from "react-share";
import { cn } from "@/lib/utils";


const SharingModal = ({ isOpen, onClose, onConfirm, onCancel, isProfileOwner, user }: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    onCancel: () => void,
    isProfileOwner: boolean,
    user: UserStripped
}) => {
    const { language, dictionary } = useLanguage();
    const [currentPageUrl, setCurrentPageUrl] = useState('')
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPageUrl(window.location.href);
        }
    }, []);

    const handleCopyLink = async () => {
        try {
            const currentUrl = window.location.href;
            await navigator.clipboard.writeText(currentUrl);
            // Show "Copied!" message
            setCopied(true);
            // Reset after 2 seconds
            setTimeout(() => {
                onConfirm();
                setCopied(false);
            }, 2500);

        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
                <DialogHeader className='text-md p-4'>
                    <DialogTitle className='text-md'>
                        <p className="text-xl font-medium"> {phrase(dictionary, "shareLink", language)} </p>
                    </DialogTitle>
                    <DialogDescription className='text-md'>
                        <p>{phrase(dictionary, "share_profile", language)}</p>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-row justify-center items-center gap-2 p-4 mb-4 text-md">
                    <TwitterShareButton url={currentPageUrl} title={user.nickname}>
                        <TwitterIcon size={35} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </TwitterShareButton>

                    <TelegramShareButton url={currentPageUrl} title={user.nickname}>
                        <TelegramIcon size={35} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </TelegramShareButton>

                    <WhatsappShareButton url={currentPageUrl} title={user.nickname}>
                        <WhatsappIcon size={35} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </WhatsappShareButton>

                    <PinterestShareButton url={currentPageUrl} title={user.nickname} media={user.picture || ""}>
                        <PinterestIcon size={35} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                    </PinterestShareButton>
                </div>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={handleCopyLink}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {copied
                            ? phrase(dictionary, "copied", language)
                            : phrase(dictionary, "copyLink", language)
                        }
                    </Button>
                    <Button
                        onClick={onCancel}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "close", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SharingModal;