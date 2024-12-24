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
import { useToonyzCutViewerModalStyle } from "@/styles/ModalStyles"

const ToonyzCutViewerModal = ({ webnovel, open, onClose }: { webnovel: Webnovel, open: boolean, onClose: () => void }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const { dictionary, language } = useLanguage();

    return (
        <Modal open={open} onClose={onClose}>
        <Box sx={useToonyzCutViewerModalStyle}>
            <div className="flex flex-col justify-center items-center gap-4">
                <div className="relative w-[150px] h-[200px]">
                    <Image
                        src={imageSrc}
                        alt={webnovel.title}
                        fill
                        sizes="150px"
                        className="object-cover rounded-md"
                        priority
                    />
                </div>
                
                <div className="flex flex-col justify-center items-center gap-2">
                    <p className="font-semibold text-lg text-balck dark:text-black">{webnovel.title}</p>
                    <p className="text-gray-600">{webnovel.user.nickname}</p>
                    <p className="text-gray-500 uppercase">{phrase(dictionary, webnovel.genre, language)}</p>
                    <p className="text-sm text-center max-w-[400px] text-balck dark:text-black">{webnovel.description}</p>

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
                    <Link href={`/view_webnovels?id=${webnovel.id}`}>
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
    )
}

export default ToonyzCutViewerModal 