
import { Button } from '@/components/shadcnUI/Button';
import { Dialog, DialogFooter, DialogHeader, DialogContent, DialogTitle, DialogDescription } from '@/components/shadcnUI/Dialog';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { Info, ImageUp } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import CoverArtPreview from './CoverArtPreview';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import { cn } from '@/lib/utils';

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
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-screen' showCloseButton={true}>
                <DialogHeader className='p-4'>
                    <DialogTitle className='text-lg font-bold text-black dark:text-white'>
                        <p>{phrase(dictionary, "coverArtRegister", language)}</p>
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className='w-full h-full p-4'>
                    <DialogDescription className='flex md:flex-row flex-col md:space-x-4 justify-center'>
                        <div className='flex flex-col space-y-4'>
                            <CoverArtPreview coverArt={coverArt} handleCoverArtUploadModal={handleCoverArtUploadModal} />
                            <Button
                                variant='outline'
                                onClick={handleUploadFile}
                                className="border-0 w-[200px] bg-[#DB2777] text-white inline-flex items-center justify-center"
                            >
                                <ImageUp className='w-4 h-4' />
                                {/* Upload Cover Art */}
                                {phrase(dictionary, "upload", language)}
                            </Button>
                        </div>
                        <div className='flex flex-col md:py-0 py-2 md:space-y-4 space-y-2'>
                            <p className={`text-sm text-black dark:text-white font-bold ${language == 'ko' ? 'break-keep' : ''}`}>
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
                                            onClick={(e) => {
                                                e.preventDefault();
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
                </ScrollArea>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
                    <Button
                        onClick={handleConfirm}
                        className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {phrase(dictionary, "confirm", language)}
                    </Button>
                    <Button
                        onClick={handleClose}
                        className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CoverArtModal;