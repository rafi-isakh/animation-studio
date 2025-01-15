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
        <div key={webnovel.id} className='flex flex-col justify-center items-center gap-4 w-full md:max-w-[200px]'>
            <div className='relative group w-[150px] h-[200px]'>
                <Link href='#'>
                <Image
                    onClick={(event) => handleOpenModal(event)}
                    src={imageSrc}
                    alt={webnovel.title}
                    fill
                    className='object-cover rounded-xl group-hover:opacity-50 transition-opacity duration-300'
                />
                </Link>
            </div>
            <div className='flex flex-col items-center gap-1 w-full'>
                <p className='font-semibold truncate w-full text-center text-base'>{webnovel.title}</p>
                <p className='text-gray-600 truncate w-full text-center text-sm'>{webnovel.user.nickname}</p>
                <p className='text-gray-500 truncate w-full text-center text-sm'>
                    {phrase(dictionary, webnovel.genre, language)}
                </p>
            </div>
            <Button
                onClick={handleOpenSubmitModal}
                sx={{
                    backgroundColor: 'transparent',
                    border: '2px solid #8A2BE2',
                    color: '#8A2BE2',

                    '&:hover': {
                        backgroundColor: '#8A2BE2',
                        color: '#fff',
                    }
                }}
                className='bg-transparent border-1 text-[#8A2BE2]
                           dark:text-[#8A2BE2]
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