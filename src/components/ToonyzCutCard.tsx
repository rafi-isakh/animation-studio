'use client'
import { Webnovel, Webtoon } from "@/components/Types"
import Image from "next/image"
import { Button, Modal, Box, Typography } from "@mui/material"
import { getImageUrl } from "@/utils/urls"
import { phrase } from "@/utils/phrases"
import { useState } from "react"
import Link from "next/link"

const ToonyzCutCard = ({ webnovel }: { webnovel: Webnovel }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const [openModal, setOpenModal] = useState(false)

    const handleOpenModal = () => {
        setOpenModal(true)
    }

    const handleCloseModal = () => {
        setOpenModal(false)
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
                <p className='text-gray-500 text-xs truncate w-full text-center'>{webnovel.genre}</p>
            </div>
            <Button
                className='bg-[#070B34] border-2 text-white hover:text-[#8A2BE2] 
                                    rounded-md flex flex-row items-center justify-center
                                    gap-2 md:text-sm text-[10px] w-full mt-2 py-2'
            >
                Submit Proposal
            </Button>
            {/* modal for view */}
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: 'translate(-50%, -50%)',
                     width: 500,
                     height: 480,
                     bgcolor: 'background.paper',
                     border: '1px solid #e5e5e5',
                     borderRadius: '12px',
                     p: 4,
                }}>
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
                            <p className="font-semibold text-lg">{webnovel.title}</p>
                            <p className="text-gray-600">{webnovel.user.nickname}</p>
                            <p className="text-gray-500">{webnovel.genre}</p>
                            <p className="text-sm text-center max-w-[400px]">{webnovel.description}</p>

                            <Button 
                            sx={{
                                color: '#070B34',
                                border: '1px solid #070B34',
                                borderRadius: '12px',
                                mt: 2,
                            }}
                            variant="outlined" 
                            className="mt-4">
                            <Link href={`/view_webnovels?id=${webnovel.id}`}>
                                Read More
                             </Link>
                            </Button>
                        </div>
                    </div>
                </Box>
            </Modal>
        </div>
    )
}
export default ToonyzCutCard