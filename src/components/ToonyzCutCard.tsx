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

const ToonyzCutCard = ({ webnovel }: { webnovel: Webnovel }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const [openModal, setOpenModal] = useState(false)
    const [openSubmitModal, setOpenSubmitModal] = useState(false)
    const { dictionary, language } = useLanguage();
    const handleOpenModal = () => {
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
        <div key={webnovel.id} className='flex flex-col justify-center items-center gap-4 w-full md:max-w-[200px]'>
            <div className='relative group w-[150px] h-[200px]'>
                <Image
                    src={imageSrc}
                    alt={webnovel.title}
                    fill
                    className='object-cover group-hover:opacity-50 transition-opacity duration-300'
                />
                <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <Button
                        onClick={handleOpenModal}
                        className='bg-[#070B34] border-2 text-white hover:text-[#8A2BE2] 
                                rounded-md flex items-center justify-center 
                                gap-2 md:text-[10px] text-[10px] px-4 py-2'
                    >
                        View
                    </Button>
                </div>
            </div>
            <div className='flex flex-col items-center gap-1 w-full'>
                <p className='font-semibold text-sm truncate w-full text-center'>{webnovel.title}</p>
                <p className='text-gray-600 text-xs truncate w-full text-center'>{webnovel.user.nickname}</p>
                <p className='text-gray-500 text-xs truncate w-full text-center'>
                    {phrase(dictionary, webnovel.genre, language)}
                </p>
            </div>
            <Button
                onClick={handleOpenSubmitModal}
                sx={{
                    backgroundColor: '#070B34',
                    border: '2px solid #070B34',
                    color: '#fff',
                    '&:hover': {
                        backgroundColor: '#8A2BE2',
                        color: '#fff',
                    }
                }}
                className='bg-[#070B34] border-2 text-white
                           dark:text-white
                           hover:text-white
                           rounded-md flex flex-row items-center justify-center
                           gap-2 md:text-sm text-[10px] w-full mt-2 py-2'
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