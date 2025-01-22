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

    const handleClose = () => {
        setShowPromotionModal(false);
        localStorage.setItem('hasSeenPromotionModal', 'true');
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            const hasSeenModal = localStorage.getItem('hasSeenPromotionModal');
            if (!hasSeenModal) {
                setShowPromotionModal(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return showPromotionModal ? (
        <PromotionModal handleClose={handleClose} />
    ) : null;
}

const PromotionModal = ({ handleClose }: { handleClose: () => void }) => {
    const { dictionary, language } = useLanguage();
    const [showModal, setShowModal] = useState(true);

    return (
        <Modal
            open={showModal}
            onClose={handleClose}
            className="flex items-center justify-center"
        >
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Semi-transparent overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-80" onClick={handleClose} />

                {/* Modal content container */}
                <div className="relative z-10 w-full mx-auto px-4">
                    {/* Image container with aspect ratio */}
                    <Link href='/creators'>
                        <div className="relative" style={{ aspectRatio: '16/9' }}>
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
                            onClick={() => {
                                handleClose();
                                localStorage.setItem('dontShowAgain', 'true');
                            }}
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