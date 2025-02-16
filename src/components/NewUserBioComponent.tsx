"use client"

import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { phrase } from "@/utils/phrases";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { alpha, styled } from '@mui/material/styles';
import { useTheme } from "@/contexts/providers";

const NewUserBioComponent = ({ 
    value, 
    onChange,
}: { 
    value: string, 
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) => {
    const { dictionary, language } = useLanguage();
    const maxText = 500;
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [content, setContent] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= maxText) {
            setContent(newValue);
            onChange(e);
        }
    };

    const StyledLabel = styled(FormLabel)(({ theme }) => ({
        color: isDarkMode ? 'white' : 'black',
        fontFamily: ['Pretendard'].join(','),
        fontSize: '0.875rem',
    }));

    return (
        <Box sx={{
            width: '100%',
        }}>
            <FormControl fullWidth variant="standard">
                <StyledLabel>Bio</StyledLabel>
                <TextField
                    slotProps={{
                        input: {
                            sx: {
                                width: '100%',
                                borderRadius: '8px',
                                position: 'relative',
                                color: isDarkMode ? 'white' : 'black',
                                backgroundColor: isDarkMode ? '#1A2027' : '#F3F6F9',
                                border: '1px solid',
                                borderColor: isDarkMode ? '#2D3843' : '#E0E3E7',
                                fontSize: '1rem',
                                padding: '8px 12px',
                                boxShadow: 'none',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: '#DE2B74',
                                },
                                '&:focus': {
                                    boxShadow: `${alpha('#DE2B74', 0.25)} 0 0 0 0.2rem`,
                                    borderColor: '#DE2B74',
                                },
                            },
                        },
                    }}
                    onChange={handleChange}
                    value={content}
                    id="outlined-multiline-static"
                    name="bio"
                    placeholder={phrase(dictionary, "intro", language)}
                    rows={4}
                    multiline
                    defaultValue={value}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#DE2B74',
                                boxShadow: `${alpha('#DE2B74', 0.25)} 0 0 0 0.2rem`,
                            },
                            '& .MuiInputBase-input': {
                                width: '100%',
                                borderRadius: '8px',
                                position: 'relative',
                                color: isDarkMode ? 'white' : 'black',
                                backgroundColor: 'transparent',
                                border: '0px',
                                borderColor: 'transparent',
                                fontSize: '1rem',
                                padding: '0',
                                transition: 'all 0.3s ease',
                                '&:focus': {
                                    boxShadow: 'none',
                                    border: '0px',
                                    borderColor: 'transparent',
                                },
                            }
                        }
                    }}
                />
                <Box sx={{ textAlign: 'right', mt: 1, fontSize: '0.8rem' }}>
                    {content.length}/{maxText}
                </Box>
            </FormControl>
        </Box>
    );
};

export default NewUserBioComponent;
