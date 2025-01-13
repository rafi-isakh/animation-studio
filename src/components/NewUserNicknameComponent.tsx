"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import '@/styles/new_user.css'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTheme } from "@/contexts/providers";

const NewUserNicknameComponent = () => {
    const { dictionary, language } = useLanguage();
    const { theme, isDarkMode } = useTheme();

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
                    label={phrase(dictionary, "nickname", language)}
                    id="outlined-basic"
                    type="text"
                    variant="outlined"
                    name="nickname"
                    size="small"
                    required
                    className='w-full text-black dark:text-white'
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

export default NewUserNicknameComponent;