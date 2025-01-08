"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";
import '@/styles/new_user.css'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

const NewUserBioComponent = () => {
    const { dictionary, language } = useLanguage();
    const maxText = 500;
    const [currText, setCurrText] = useState(0);
    const [content, setContent] = useState('');

    useEffect(() => {
        setCurrText(content.length);
    }, [content])

    const trim = (text: string) => {
        text = text.substring(0, maxText)
        return text
    }
    
    return (
        <div className='w-full text-black dark:text-black focus:outline-none'>
            <Box
                component="form"
                sx={{
                    color: 'black',
                    '& .MuiTextField-root': { m: 0 },
                }}
                autoComplete="off"
            >
                <TextField
                    label={phrase(dictionary, "intro", language)}
                    id="outlined-multiline-static"
                    name="bio"
                    rows={10}
                    value={content}
                    multiline
                    onChange={(e) => setContent(trim(e.target.value))}
                    className='input rounded-md w-full text-black dark:text-black'
                />
            </Box>
        </div>

    )
}

export default NewUserBioComponent;

