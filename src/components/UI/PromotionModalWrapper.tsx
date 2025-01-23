// PromotionModalWrapper.tsx
'use client'
import { useState, useEffect } from "react";
import { Modal } from "@mui/material";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Image from "next/image";
import Link from "next/link";

export default function PromotionModalWrapper() {
    const [showPromotionModal, setShowPromotionModal] = useState(false);

    // Handle permanent closing (Don't show again)
    const handleClosePermanently = () => {
        try {
            localStorage.setItem('hasSeenPromotionModal', 'true');
            setShowPromotionModal(false);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            // Fallback to just closing the modal if localStorage fails
            setShowPromotionModal(false);
        }
    }

    // Handle temporary closing
    const handleClose = () => {
        setShowPromotionModal(false);
    }

    useEffect(() => {
        // Check localStorage first before setting timer
        const hasSeenModal = localStorage.getItem('hasSeenPromotionModal');
        
        if (hasSeenModal === 'true') {
            return; // Don't show modal if user has chosen to not see it again
        }

        const timer = setTimeout(() => {
            try {
                // Double check hasSeenModal in case it changed during the timeout
                const currentHasSeenModal = localStorage.getItem('hasSeenPromotionModal');
                if (currentHasSeenModal !== 'true') {
                    setShowPromotionModal(true);
                }
            } catch (error) {
                console.error('Error checking localStorage:', error);
                // Show modal anyway if localStorage fails
                setShowPromotionModal(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return showPromotionModal ? (
        <PromotionModal 
            handleClose={handleClose} 
            handleClosePermanently={handleClosePermanently} 
        />
    ) : null;
}

const PromotionModal = ({ handleClose, handleClosePermanently }: { handleClose: () => void, handleClosePermanently: () => void }) => {
    const { dictionary, language } = useLanguage();
    const [showModal, setShowModal] = useState(true);

    return (
        <Modal
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                outline: 'none',
                '& :focus': {
                    outline: 'none'
                }
            }}
            open={showModal}
            onClose={handleClose}
            className="flex items-center justify-center"
        >
            <div className="flex flex-col mx-auto items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-80" onClick={handleClose} />
                <div className="relative z-10 w-full mx-auto px-4">
                    {/* Image container with aspect ratio */}
                    <Link href='/creators'>
                        <div className="relative w-[250px] h-[350px]">
                            <Image
                                src="/promotion/new_creators_promotion.png"
                                alt="promotion banner"
                                width={300}
                                height={350}
                                priority
                                className="object-cover"
                            />
                        </div>
                    </Link>
                    {/* Close button */}
                    <div className="flex flex-row justify-between mt-6">
                        <button
                            onClick={handleClose}
                            className="text-white/70 hover:text-white text-sm"
                        >
                            {phrase(dictionary, 'close', language)}
                        </button>
                        {/* Don't show again option */}
                        <button
                            onClick={handleClosePermanently}
                            className="text-white/70 hover:text-white text-sm"
                        >
                            {phrase(dictionary, 'dontShowAgain', language)}
                        </button>

                    </div>
                </div>
            </div>
        </Modal>
    );
};