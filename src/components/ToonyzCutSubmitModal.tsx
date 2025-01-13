'use client'
import { Webnovel, Webtoon } from "@/components/Types"
import Image from "next/image"
import TextField from '@mui/material/TextField';
import { Button, Modal, Box, Radio, RadioGroup, FormControlLabel, FormLabel, FormControl } from "@mui/material"
import { getImageUrl } from "@/utils/urls"
import { phrase } from "@/utils/phrases"
import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToonyzCutSubmitModalStyle } from "@/styles/ModalStyles"

const ToonyzCutSubmitModal = ({ webnovel, open, onClose }: { webnovel: Webnovel, open: boolean, onClose: () => void }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const [openModal, setOpenModal] = useState(false)
    const [openSubmitModal, setOpenSubmitModal] = useState(false)
    const { dictionary, language } = useLanguage();
   
    const handleSubmit = () => {
        console.log('submit')
    }


    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={useToonyzCutSubmitModalStyle}>
                <div className="flex flex-col gap-4">
                    <h1 className="text-xl font-bold text-balck dark:text-black">Your Proposal</h1>
                    <div className="relative w-[150px] h-[200px] mx-auto">
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
                        <hr className="w-full border-gray-300" />

                        <p className="text-sm max-w-[400px] font-bold text-balck dark:text-black">
                            {/* 위 작품에 대해서 어떻게 영상을 진행하고 싶으세요? */}
                            {phrase(dictionary, 'toonyzCut_how_to_proceed', language)}
                        </p>

                        <div className="flex flex-col gap-2 w-full">
                            <TextField id="outlined-company-name"
                                label={phrase(dictionary, 'company_name', language)}
                                variant="outlined"
                                type="text"
                                placeholder={phrase(dictionary, 'company_name', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-full-name"
                                label={phrase(dictionary, 'full_name', language)}
                                variant="outlined"
                                type="text"
                                placeholder={phrase(dictionary, 'full_name', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-email"
                                label={phrase(dictionary, 'email_address', language)}
                                variant="outlined"
                                type="email"
                                placeholder={phrase(dictionary, 'email_address', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-contact-number"
                                label={phrase(dictionary, 'contact_number', language)}
                                variant="outlined"
                                type="text"
                                placeholder={phrase(dictionary, 'contact_number', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-genre"
                                label={phrase(dictionary, 'genre', language)}
                                variant="outlined"
                                type="text"
                                placeholder={phrase(dictionary, 'genre', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-country"
                                label={phrase(dictionary, 'country', language)}
                                variant="outlined"
                                type="text"
                                placeholder={phrase(dictionary, 'country', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            {/* <TextField id="outlined-project-type" label="Which Type of Project Would You Like to Develop?" variant="outlined" type="text" placeholder="Which Type of Project Would You Like to Develop?" className="border border-gray-300 rounded-md p-2" /> */}
                            <FormLabel id="demo-row-radio-buttons-group-label">
                                {/* Which Type of Project Would You Like to Develop? */}
                                {phrase(dictionary, 'toonyzCut_which_type_of_project', language)}
                            </FormLabel>
                            <RadioGroup
                                row
                                aria-labelledby="row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                                className="text-black dark:text-black"
                            >
                                <FormControlLabel
                                    value="Webtoon"
                                    control={<Radio />}
                                    label="Webtoon"
                                />
                                <FormControlLabel
                                    value="Game"
                                    control={<Radio />}
                                    label="Game"
                                />
                                <FormControlLabel
                                    value="Film & Drama"
                                    control={<Radio />}
                                    label="Film & Drama"
                                />
                                <FormControlLabel
                                    value="other"
                                    control={<Radio />}
                                    label="other"
                                />
                            </RadioGroup>

                            <TextField fullWidth
                                label={phrase(dictionary, 'full_description', language)}
                                id="full-description"
                                variant="outlined"
                                type="text"
                                placeholder={phrase(dictionary, 'full_description', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                        </div>

                        <div className="flex flex-row justify-center items-center gap-2">
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
                                <Link href=''>
                                    {/* Submit */}
                                    {phrase(dictionary, 'submit', language)}
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

export default ToonyzCutSubmitModal