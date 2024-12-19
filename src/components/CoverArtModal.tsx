import { Modal, Box, Button, Tooltip } from '@mui/material';
import { useCoverArtModalStyle } from '@/styles/ModalStyles';
import { phrase } from '@/utils/phrases';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useLanguage } from '@/contexts/LanguageContext';
import { Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const CoverArtModal = ({ showCoverArtModal, setShowCoverArtModal }
    : { showCoverArtModal: boolean, setShowCoverArtModal: (show: boolean) => void }) => {
    const { dictionary, language } = useLanguage();
    const [coverArtOptions] = useState(Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        src: `/coverArts/${i + 1}.jpg`, // Cycles through images 1-4
        value: i < 4 ? 'small' : 'big' // Example of varying the value
    })));
    
    return (
        <Modal open={showCoverArtModal} onClose={() => setShowCoverArtModal(false)}>
            <Box sx={useCoverArtModalStyle}>
                <div className='flex flex-col space-y-4'>
                    <p className='text-lg font-bold text-black dark:text-black'>
                        {/* Cover Art Register */}
                        {phrase(dictionary, "coverArtRegister", language)}
                    </p>

                    <p className='text-sm text-black font-bold'>
                        {/* Please upload the cover art for your webnovel. */}
                        {phrase(dictionary, "pleaseUploadTheCoverArt", language)}
                    </p>

                    <p className='text-sm text-gray-500 font-bold'>
                        {/* The cover art must be in a 5:3 aspect ratio. */}
                        {phrase(dictionary, "coverArtMustBeInA53AspectRatio", language)}
                    </p>
                    <p className='text-sm text-gray-500'>
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

                    <p className='text-sm text-gray-500'>
                        {/* Book cover must be safe for all ages.
               Graphic violence, sexual nudity, and hateful content are strictly prohibited. */}
                        {phrase(dictionary, "bookCoverMustBeSafeForAllAges", language)}
                    </p>

                    <p className='text-sm text-black font-bold'>
                        {/* Do you need a guide line for cover art? */}
                        {phrase(dictionary, "doYouNeedAGuideLineForCoverArt", language)}
                    </p>
                    <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                        <Button sx={{ backgroundColor: '#eee', color: 'black' }} className='text-black bg-gray-300 rounded-sm px-2 text-sm w-32'>
                            <Link href="">
                                {/* Learn more */}
                                {phrase(dictionary, "learnMore", language)}
                            </Link>
                        </Button>
                    </Tooltip>

                    <div className='grid grid-cols-4 gap-2 overflow-y-auto h-60 p-1'>
                        {coverArtOptions.map((option) => (
                            <label key={option.id}>
                                <input
                                    type="radio"
                                    name="Selecting_CoverArt"
                                    value={option.value}
                                />
                                <Image
                                    src={option.src}
                                    alt={`Option ${option.id}`}
                                    width={200}
                                    height={300}
                                />
                            </label>
                        ))}
                    </div>

                    <div className='flex flex-row space-x-4 justify-center items-center'>
                        <Button color='gray' variant='outlined' className='mt-10 w-32 text-blue-500 dark:text-blue-500'>
                            {phrase(dictionary, "confirm", language)}
                        </Button>
                        <Button
                            onClick={() => setShowCoverArtModal(false)}
                            color='gray'
                            variant='outlined'
                            className='mt-10 w-32 text-[#DB2777] dark:text-[#DB2777] hover:bg-[#DB2777] hover:text-white dark:hover:bg-[#DB2777] dark:hover:text-white'>
                            {phrase(dictionary, "close", language)}
                        </Button>
                    </div>
                </div>
            </Box>
        </Modal>

    )
}

export default CoverArtModal;