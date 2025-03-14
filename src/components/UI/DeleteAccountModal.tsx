'use client'
import React from 'react';
import { Button } from '@/components/shadcnUI/Button';
import { Modal, Box } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import Image from 'next/image';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const { language, dictionary } = useLanguage();

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
            <div className="flex flex-col items-center justify-center w-[350px]">
                {/* character */}
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

                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold text-black dark:text-black'>
                            {phrase(dictionary, "deleteAccountConfirm", language)}
                        </p>
                        <Button
                            variant='outline'
                            onClick={onConfirm}
                            className="w-full py-2 bg-[#DE2B74] text-white rounded-full hover:bg-[#DE2B74]/80 transition-colors"
                        >
                            {phrase(dictionary, "yes", language)}
                        </Button>
                        <Button
                            variant='outline'
                            onClick={onClose}
                            className="w-full py-2 border-2 border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            {phrase(dictionary, "no", language)}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteAccountModal;