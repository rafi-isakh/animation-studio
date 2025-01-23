import { Modal, Box, Button, Tooltip } from '@mui/material';
import { useCoverArtModalStyle } from '@/styles/ModalStyles';
import { phrase } from '@/utils/phrases';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useLanguage } from '@/contexts/LanguageContext';
import { Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SetStateAction, Dispatch, useState } from 'react';
import CoverArtPreview from './CoverArtPreview';

const CoverArtModal = ({ 
    showCoverArtModal, 
    setShowCoverArtModal, 
    handleUploadFile, 
    handleFileChange, 
    coverArt, 
    setCoverArtFile, 
    handleCoverArtUploadModal 
}
    : { 
        showCoverArtModal: boolean, 
        setShowCoverArtModal: (show: boolean) => void, 
        handleUploadFile: () => void, 
        handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
        coverArt: File | null, 
        setCoverArtFile: (file: File) => void, 
        handleCoverArtUploadModal: (e: React.MouseEvent) => void 
    }) => {
    const { dictionary, language } = useLanguage();
    const [coverArtOptions] = useState(Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        src: `https://picsum.photos/id/${500 + i + 1}/300/500`,
        value: i < 4 ? 'small' : 'big' 
    })));

    const handleConfirm = () => {
        setShowCoverArtModal(false);
    }

    const handleClose = () => {
        handleFileChange({ target: { files: null } } as React.ChangeEvent<HTMLInputElement>);
        setShowCoverArtModal(false);
    }

    return (
        <Modal open={showCoverArtModal} onClose={() => setShowCoverArtModal(false)}>
            <Box sx={useCoverArtModalStyle}>
                <div className='flex flex-row space-x-4 justify-center'>
                    <div className='flex flex-col space-y-4'>
                        <CoverArtPreview coverArt={coverArt} handleCoverArtUploadModal={handleCoverArtUploadModal} />
                        <Button variant='outlined' onClick={handleUploadFile}>
                            {/* Upload Cover Art */}
                            {phrase(dictionary, "upload", language)}
                        </Button>
                    </div>
                    <div className='flex flex-col space-y-4'>
                        <p className='text-lg font-bold text-black dark:text-black'>
                            {/* Cover Art Register */}
                            {phrase(dictionary, "coverArtRegister", language)}
                        </p>

                        <p className={`text-sm text-black font-bold ${language == 'ko' ? 'break-keep' : ''}`}>
                            {/* Please upload the cover art for your webnovel. */}
                            {phrase(dictionary, "pleaseUploadTheCoverArt", language)}
                        </p>

                        <p className={`text-sm text-gray-500 font-bold ${language == 'ko' ? 'break-keep' : ''}`}>
                            {/* The cover art must be in a 5:3 aspect ratio. */}
                            {phrase(dictionary, "coverArtMustBeInA53AspectRatio", language)}
                        </p>
                        <p className={`text-sm text-gray-500 ${language == 'ko' ? 'break-keep' : ''}`}>
                            {/*
                        It ideally sized at 1500 x 900 px, but can be smaller than 1000 x 600 px.
                        It must be in PNG, GIF, or JPG format, smaller than 2MB. */}
                            {phrase(dictionary, "coverArtSize", language)}
                        </p>

                        <div className='flex flex-row gap-1 items-center'>
                            <Info size={12} className='self-center text-[#DB2777]' />
                            <p className='text-sm text-[#DB2777]'>
                                {/* Mature Content and Cover Art Violence rules */}
                                {phrase(dictionary, "matureContentAndCoverArtViolenceRules", language)}
                            </p>
                        </div>

                        <p className={`text-sm text-gray-500 ${language == 'ko' ? 'break-keep' : ''}`}>
                            {/* Book cover must be safe for all ages.
                            Graphic violence, sexual nudity, and hateful content are strictly prohibited. */}
                            {phrase(dictionary, "bookCoverMustBeSafeForAllAges", language)}
                        </p>
                        <div className='grid grid-cols-4 gap-2 overflow-y-auto h-60 p-1'>
                            {coverArtOptions.map((option) => (
                                <label key={option.id}>
                                    <input
                                        type="radio"
                                        name="Selecting_CoverArt"
                                        value={option.value}
                                    />
                                    <Image
                                        onClick={() => {
                                            fetch(option.src)
                                                .then(res => res.blob())
                                                .then(blob => {
                                                    const file = new File([blob], '/coverArt.jpg', { type: 'image/jpeg' });
                                                    setCoverArtFile(file);
                                                });
                                        }}
                                        src={option.src}
                                        alt={`Option ${option.id}`}
                                        width={200}
                                        height={300}
                                    />
                                </label>
                            ))}
                        </div>

                        <div className='flex flex-row space-x-4 justify-center items-center'>
                            <Button color='gray' variant='outlined' className='mt-10 w-32 text-blue-500 dark:text-blue-500' onClick={handleConfirm}>
                                {phrase(dictionary, "confirm", language)}
                            </Button>
                            <Button
                                onClick={handleClose}
                                color='gray'
                                variant='outlined'
                                className='mt-10 w-32 text-[#DB2777] dark:text-[#DB2777] hover:bg-[#DB2777] hover:text-white dark:hover:bg-[#DB2777] dark:hover:text-white'>
                                {phrase(dictionary, "cancel", language)}
                            </Button>
                        </div>
                    </div>
                </div>
            </Box>
        </Modal>

    )
}

export default CoverArtModal;