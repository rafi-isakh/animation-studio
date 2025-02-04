import React from 'react';
import Image from 'next/image';
import { Modal, Box } from '@mui/material';

const StyledModal = ({ isOpen, onClose, onConfirm, onCancel, isProfileOwner }: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    onCancel: () => void,
    isProfileOwner: boolean
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

            <div className="flex flex-col items-center justify-center">
                {/* Cute character */}
                <div className="relative top-[-1px]">
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

                    {/* Content */}
                    <div className="text-center mb-8">
                        <p className="text-xl mb-2 font-medium">title</p>
                        {/* <p className="text-gray-600"></p> */}
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={onConfirm}
                            className="w-full py-2 bg-[#DE2B74] text-white rounded-full hover:bg-[#DE2B74]/80 transition-colors"
                        >
                            button title
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full py-2 border-2 border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            close
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default StyledModal;