
import { Button } from '@/components/shadcnUI/Button';
import { Dialog, DialogFooter, DialogHeader, DialogContent, DialogTitle, DialogDescription } from '@/components/shadcnUI/Dialog';
import { phrase } from '@/utils/phrases';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useLanguage } from '@/contexts/LanguageContext';
import { Info, X, MoveLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SetStateAction, Dispatch, useState } from 'react';
import CoverArtPreview from './CoverArtPreview';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';

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
        <Dialog open={showCoverArtModal} onOpenChange={setShowCoverArtModal}>
            <DialogContent className='bg-white dark:bg-black flex flex-col justify-center items-center w-full md:h-auto h-screen'>
                <ScrollArea className='w-full h-full'>
                    <DialogHeader className='flex flex-row justify-start items-center my-2 w-full'>
                        <Button 
                        variant='link' 
                        onClick={() => setShowCoverArtModal(false)} 
                        className={`!no-underline justify-center items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors flex md:hidden !m-0 !p-0`}>
                            <MoveLeft size={20} className='dark:text-white text-gray-500' />
                           
                        </Button>
                        <DialogTitle className='text-lg font-bold text-black dark:text-white text-center'>
                            {/* Cover Art Register */}
                            <p className='text-center md:ml-0 ml-5'>{phrase(dictionary, "coverArtRegister", language)}</p>
                        </DialogTitle>
                    </DialogHeader>

                    <DialogDescription className='flex md:flex-row flex-col md:space-x-4 justify-center'>
                        <div className='flex flex-col space-y-4'>
                            <CoverArtPreview coverArt={coverArt} handleCoverArtUploadModal={handleCoverArtUploadModal} />
                            <Button
                                variant='outline'
                                onClick={handleUploadFile}
                                className="border-0 w-[200px] bg-[#DB2777] text-white"
                            >
                                {/* Upload Cover Art */}
                                {phrase(dictionary, "upload", language)}
                            </Button>
                        </div>
                        <div className='flex flex-col md:py-0 py-2 md:space-y-4 space-y-2'>
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
                        </div>
                    </DialogDescription>
                    <DialogFooter className='flex flex-row gap-2 my-5 md:py-0 pb-10 justify-center items-center'>
                        <Button
                            onClick={handleConfirm}
                            variant='outline'
                            className='w-32 text-blue-500 dark:text-blue-500'
                        >
                            {phrase(dictionary, "confirm", language)}
                        </Button>
                        <Button
                            onClick={handleClose}
                            variant='outline'
                            className='w-32 text-[#DB2777] dark:text-[#DB2777] hover:bg-[#DB2777] hover:text-white dark:hover:bg-[#DB2777] dark:hover:text-white'
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </DialogFooter>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export default CoverArtModal;