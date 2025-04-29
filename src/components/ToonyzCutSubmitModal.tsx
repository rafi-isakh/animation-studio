'use client'
import { Webnovel } from "@/components/Types"
import Image from "next/image"
import TextField from '@mui/material/TextField';
import { Button, Modal, Box, Radio, RadioGroup, FormControlLabel, FormLabel, FormControl } from "@mui/material"
import { getImageUrl } from "@/utils/urls"
import { phrase } from "@/utils/phrases"
import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToonyzCutSubmitModalStyle } from "@/styles/ModalStyles"
import OtherTranslateComponent from "./OtherTranslateComponent";
import { CircleX } from "lucide-react";

const ToonyzCutSubmitModal = ({ webnovel, open, onClose }: { webnovel: Webnovel, open: boolean, onClose: () => void }) => {
    const imageSrc = getImageUrl(webnovel?.cover_art)
    const { dictionary, language } = useLanguage();
    const [companyName, setCompanyName] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [country, setCountry] = useState('');
    const [projectType, setProjectType] = useState('');
    const [fullDescription, setFullDescription] = useState('');

    const handleSubmit = async () => {
        const message = `Proposal for ${webnovel.title} by ${webnovel.author.nickname}:\n
        Company Name: ${companyName}\n
        Full Name: ${fullName}\n
        Email: ${email}\n
        Contact Number: ${contactNumber}\n
        Country: ${country}\n
        Project Type: ${projectType}\n
        Full Description: ${fullDescription}`

        await fetch('/api/send_email', {
            method: 'POST',
            body: JSON.stringify({ message: message, subject: 'Toonyz Cut Proposal', staffEmail: 'dami@stelland.io, min@stelland.io' })
        });
        
    }


    return (
        <Modal 
         open={open}
         onClose={onClose}
         >
            <Box sx={useToonyzCutSubmitModalStyle}>
                <div className="flex flex-col gap-4 md:p-2 p-10">
                    <div className="flex flex-row justify-between">
                        <h1 className="text-xl font-bold text-balck dark:text-black">Your Proposal</h1>
                        <CircleX
                            size={16}
                            onClick={onClose}
                            className="cursor-pointer self-center text-gray-400 dark:text-gray-400 hover:text-[#db2777] transition-color duration-300" />
                    </div>
                    <div className="relative w-[150px] h-[200px] mx-auto">
                        <Image
                            src={imageSrc}
                            alt={webnovel.title}
                            fill
                            sizes="150px"
                            className="object-cover rounded-md"
                        />
                    </div>

                    <div className="flex flex-col justify-center items-center gap-2">
                        <p className="font-semibold text-lg text-balck dark:text-black">
                            <OtherTranslateComponent element={webnovel} content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype='title' />
                        </p>
                        <p className="text-gray-600">{webnovel.author.nickname}</p>
                        <p className="text-gray-500 uppercase">{phrase(dictionary, webnovel.genre, language)}</p>
                        <p className="text-sm text-center max-w-[400px] text-balck dark:text-black line-clamp-3">
                            <OtherTranslateComponent 
                                element={webnovel}
                                content={webnovel.description.length > 100 
                                    ? `${webnovel.description.slice(0, 100)}...` 
                                    : webnovel.description
                                } 
                                elementId={webnovel.id.toString()} 
                                elementType='webnovel' 
                                elementSubtype='description' 
                            />
                        </p>
                        <hr className="w-full border-gray-300" />

                        <p className="text-sm max-w-[400px] font-bold text-balck dark:text-black">
                            {/* 위 작품에 대해서 제안을 공유해 주세요 */}
                            {phrase(dictionary, 'toonyzCut_how_to_proceed', language)}
                        </p>

                        <div className="flex flex-col gap-2 w-full">
                            <TextField id="outlined-company-name"
                                label={phrase(dictionary, 'company_name', language)}
                                variant="outlined"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                type="text"
                                placeholder={phrase(dictionary, 'company_name', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-full-name"
                                label={phrase(dictionary, 'full_name', language)}
                                variant="outlined"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                type="text"
                                placeholder={phrase(dictionary, 'full_name', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-email"
                                label={phrase(dictionary, 'email_address', language)}
                                variant="outlined"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={phrase(dictionary, 'email_address', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-contact-number"
                                label={phrase(dictionary, 'contact_number', language)}
                                variant="outlined"
                                type="text"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                placeholder={phrase(dictionary, 'contact_number', language)}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <TextField id="outlined-country"
                                label={phrase(dictionary, 'country', language)}
                                variant="outlined"
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
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
                                    label="Other"
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
                                onClick={handleSubmit}
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
                                    {/* Submit */}
                                    {phrase(dictionary, 'submit', language)}
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