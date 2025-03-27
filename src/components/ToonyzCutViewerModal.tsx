'use client'
import { Webnovel } from "@/components/Types"
import Image from "next/image"
import TextField from '@mui/material/TextField';
import { Button, Modal, Box, Typography, Radio, RadioGroup, FormControlLabel, FormLabel, FormControl } from "@mui/material"
import { getImageUrl } from "@/utils/urls"
import { phrase } from "@/utils/phrases"
import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToonyzCutViewerModalStyle } from "@/styles/ModalStyles"
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import ToonyzCutSubmitModal from "@/components/ToonyzCutSubmitModal";
import { Eye } from "lucide-react";
const ToonyzCutViewerModal = ({ webnovel, open, onClose }: { webnovel: Webnovel, open: boolean, onClose: () => void }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const [openSubmitModal, setOpenSubmitModal] = useState(false)
    const { dictionary, language } = useLanguage();

    const handleOpenSubmitModal = () => {
        setOpenSubmitModal(true)
    }

    const handleCloseSubmitModal = () => {
        setOpenSubmitModal(false)
    }

    return (
        <>
        <Modal open={open} onClose={onClose}>
            <Box sx={useToonyzCutViewerModalStyle}>
                <div className="flex flex-col justify-center items-center gap-4">
                    <div className="relative w-[150px] h-[200px] group">
                        <Image
                            src={imageSrc}
                            alt={webnovel.title}
                            fill
                            sizes="150px"
                            className="object-cover rounded-md"
                        />
                        <div className="absolute bottom-0 left-0 w-full 
                            bg-gradient-to-t from-black/50 to-transparent
                            group-hover:opacity-100 rounded-b-xl
                            transition-opacity duration-300">
                            <Button
                                onClick={handleOpenSubmitModal}
                                sx={{
                                    backgroundColor: '#db2777',
                                    border: '0px solid white',
                                    color: 'white',
                                    width: '100%',
                                    padding: '8px',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        borderColor: '#db2777',
                                        color: '#fff',
                                    }
                                }}
                                className='text-sm'
                            >
                                {phrase(dictionary, 'submit_proposal', language)}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center gap-2">

                         {/* miscellanous */}
                         <div className="flex flex-row space-x-2 text-sm">
                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                    <Eye size={11} /> {webnovel.views}
                                </div>
                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                    {/* heart icon */}
                                    <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z" fill="#6B7280" />
                                    </svg>
                                    {webnovel.upvotes}
                                </div>
                            </div>
                            
                        <p className="font-semibold text-lg text-balck dark:text-black break-keep">
                            <OtherTranslateComponent content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype='title' />
                        </p>
                        <p className="text-gray-600">{webnovel.author.nickname}</p>
                        <p className="text-gray-500 uppercase">{phrase(dictionary, webnovel.genre, language)}</p>
                        <p className="text-sm text-center max-w-[400px] text-balck dark:text-black break-keep">
                            <OtherTranslateComponent content={webnovel.description} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype='description' />
                        </p>


                        <div className="flex flex-row gap-2">
                            <Button
                                sx={{
                                    color: '#070B34',
                                    border: '1px solid #070B34',
                                    borderRadius: '5px',
                                    mt: 2,
                                    '&:hover': {
                                        backgroundColor: '#070B34',
                                        color: '#fff',
                                    }
                                }}
                                variant="outlined"
                                className="mt-4">
                                <Link href={`/view_webnovels/${webnovel.id}`}>
                                    {/* Read More */}
                                    {phrase(dictionary, 'readmore', language)}
                                </Link>
                            </Button>
                            <Button
                                onClick={onClose}
                                sx={{
                                    color: '#DC277A',
                                    border: '1px solid #DC277A',
                                    borderRadius: '5px',
                                    mt: 2,
                                    '&:hover': {
                                        backgroundColor: '#DC277A',
                                        color: '#fff',
                                    }
                                }}
                                variant="outlined"
                                className="mt-4">
                                {/* close */}
                                {phrase(dictionary, 'cancel', language)}
                            </Button>
                        </div>
                    </div>
                </div>
            </Box>
        </Modal>
         {/* modal for submit proposal */}
         <ToonyzCutSubmitModal webnovel={webnovel} open={openSubmitModal} onClose={handleCloseSubmitModal} />
      </>
    )
}

export default ToonyzCutViewerModal 