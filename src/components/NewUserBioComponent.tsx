"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";
import '@/styles/new_user.css'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTheme } from "@/contexts/providers";

const NewUserBioComponent = () => {
    const { dictionary, language } = useLanguage();
    const maxText = 500;
    const [currText, setCurrText] = useState(0);
    const [content, setContent] = useState('');
    const { theme, isDarkMode } = useTheme();

    useEffect(() => {
        setCurrText(content.length);
    }, [content])

    const trim = (text: string) => {
        text = text.substring(0, maxText)
        return text
    }
    
    return (
        <div className='w-full text-black dark:text-white focus:outline-none'>
            <Box
                sx={{
                    color: isDarkMode ? 'white' : 'black',
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
                    className='input w-full text-black dark:text-white'
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: isDarkMode ? 'gray' : 'rgba(0, 0, 0, 0.23)',
                            },
                            '&:hover fieldset': {
                                borderColor: isDarkMode ? 'white' : 'rgba(0, 0, 0, 0.87)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: isDarkMode ? 'white' : 'primary.main',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: isDarkMode ? 'gray' : 'rgba(0, 0, 0, 0.6)',
                            '&.Mui-focused': {
                                color: isDarkMode ? 'white' : 'primary.main',
                            }
                        },
                        '& .MuiOutlinedInput-input': {
                            color: isDarkMode ? 'white' : 'black',
                        },
                    }}
                />
            </Box>
        </div>

    )
}

export default NewUserBioComponent;

