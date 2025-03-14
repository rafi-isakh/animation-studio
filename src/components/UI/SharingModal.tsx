'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/shadcnUI/Button'
import { User } from '@/components/Types';
import { Modal, } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import {
    FacebookShareButton,
    TwitterShareButton,
    FacebookIcon,
    TwitterIcon,
    TelegramShareButton,
    TelegramIcon,
    WhatsappShareButton,
    WhatsappIcon,
    PinterestShareButton,
    PinterestIcon,
} from "react-share";

const SharingModal = ({ isOpen, onClose, onConfirm, onCancel, isProfileOwner, user }: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    onCancel: () => void,
    isProfileOwner: boolean,
    user: User
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
        <Modal
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

            <div className="flex flex-col items-center justify-center w-[350px]">
                <div className="relative top-[10px]">
                    <div className="w-24 h-24 bg-pink-200 rounded-full flex items-center justify-center">
                        <Image src="/stelli/stelli_7.png" alt="character" width={100} height={100} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl w-full max-w-md p-6 relative">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center"
                    >
                        <span className="text-[#DE2B74] text-xl">&times;</span>
                    </button>

                    {/* Content title */}
                    <div className="text-center">
                        <p className="text-xl mb-2 font-medium text-black dark:text-black">
                            {/* Sharing your profile */}
                            {phrase(dictionary, "shareLink", language)}
                        </p>
                    </div>

                    <div className="flex flex-row justify-center items-center gap-2 my-5">
                        <FacebookShareButton url={currentPageUrl} title={user.nickname}>
                            <FacebookIcon size={35} className="text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" />
                        </FacebookShareButton>

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

                    {/* Buttons */}
                    <div className="space-y-3">
                        <Button
                            variant='outline'
                            onClick={handleCopyLink}
                            className="w-full py-2 bg-[#DE2B74] text-white rounded-full hover:bg-[#DE2B74]/80 transition-colors"
                        >
                            {/* copy link */}
                            {copied
                                ? phrase(dictionary, "copied", language) // Add this to your phrases
                                : phrase(dictionary, "copyLink", language)
                            }
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="w-full py-2 border-2 border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            {/* Close */}
                            {phrase(dictionary, "close", language)}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SharingModal;