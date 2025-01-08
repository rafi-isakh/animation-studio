"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import '@/styles/new_user.css'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';


const NewUserNicknameComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div className='w-full text-black dark:text-black'>
            <Box
                component="form"
                sx={{
                    '& .MuiTextField-root': { m: 1 },
                }}
                autoComplete="off"
            >
                <TextField
                    label={phrase(dictionary, "nickname", language)}
                    type="text"
                    name="nickname"
                    size="small"
                    required
                    className='w-full'
            />
            </Box>
        </div>
    )
}

export default NewUserNicknameComponent;