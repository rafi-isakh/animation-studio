'use client'
import { Webnovel, Webtoon } from "@/components/Types"
import Image from "next/image"
import TextField from '@mui/material/TextField';
import { Button, Modal, Box, Typography, Radio, RadioGroup, FormControlLabel, FormLabel, FormControl } from "@mui/material"
import { getImageUrl } from "@/utils/urls"
import { phrase } from "@/utils/phrases"
import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import ToonyzCutSubmitModal from "@/components/ToonyzCutSubmitModal"
import ToonyzCutViewerModal from "@/components/ToonyzCutViewerModal"
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useMediaQuery } from "@mui/material";
import { Eye } from "lucide-react";
const ToonyzCutCard = ({ webnovel }: { webnovel: Webnovel }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const [openModal, setOpenModal] = useState(false)
    const [openSubmitModal, setOpenSubmitModal] = useState(false)
    const { dictionary, language } = useLanguage();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleOpenModal = (event: React.MouseEvent<HTMLImageElement>) => {
        event.preventDefault()
        setOpenModal(true)
    }

    const handleCloseModal = () => {
        setOpenModal(false)
    }

    const handleOpenSubmitModal = () => {
        setOpenSubmitModal(true)
    }

    const handleCloseSubmitModal = () => {
        setOpenSubmitModal(false)
    }

    return (
        <div 
        key={webnovel.id} 
        className='relative flex flex-col justify-center items-center gap-2 w-full md:max-w-[200px] bg-gray-100 rounded-xl'>
            <div className='relative group w-full max-h-[200px]'>
                <Link href='#' onClick={(event) => handleOpenModal(event)}>
                    <Image
                        src={imageSrc}
                        alt={webnovel.title}
                        width={isMobile ? 100 : 200}
                        height={isMobile ? 150 : 250}
                        className='object-cover w-full h-full rounded-t-xl group-hover:opacity-50 transition-opacity duration-300'
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-black text-white dark:text-white opacity-0 group-hover:opacity-50 transition-opacity duration-300 flex flex-row gap-1 items-center justify-center rounded-t-xl">
                        <Eye size={16} className="text-white" /> View
                    </div>
                </Link>
            </div>
            <div className='flex flex-col items-center gap-1 w-full'>
                <div className='font-semibold truncate w-full text-center text-base'>
                    <OtherTranslateComponent content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype='title' />
                </div>
                <p className='text-gray-600 truncate w-full text-center text-sm'>{webnovel.user.nickname}</p>
                <p className='text-gray-500 truncate w-full text-center text-sm'>
                    {phrase(dictionary, webnovel.genre, language)}
                </p>
            </div>
            
            <Button
                onClick={handleOpenSubmitModal}
                sx={{
                    backgroundColor: 'transparent',
                    border: '2px solid #4b5563',
                    color: '#4b5563',
                    width: '100%',
                    '&:hover': {
                        backgroundColor: '#db2777',
                        color: '#fff',
                    }
                }}
                className='bg-transparent border-1 text-gray-600
                           dark:text-gray-600 w-full
                           rounded-md flex flex-row items-center justify-center
                           gap-2 text-sm'
                >
                {/* Submit Proposal */}
                {phrase(dictionary, 'submit_proposal', language)}
            </Button>
            {/* modal for submit proposal */}
            <ToonyzCutSubmitModal webnovel={webnovel} open={openSubmitModal} onClose={handleCloseSubmitModal} />
            {/* modal for quick viewing */}
            <ToonyzCutViewerModal webnovel={webnovel} open={openModal} onClose={handleCloseModal} />
        </div>
    )   
}
export default ToonyzCutCard