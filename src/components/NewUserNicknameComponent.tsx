"use client"

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import FormControl from '@mui/material/FormControl';
import { useFormControlContext } from '@mui/base/FormControl';
import { Input, inputClasses } from '@mui/base/Input';
import { useTheme } from "@/contexts/providers";
import { alpha, styled } from '@mui/material/styles';
import clsx from 'clsx';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';


const NewUserNicknameComponent = ({
    value,
    onChange,
}:
    {
        value: string,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    }) => {
    const { dictionary, language } = useLanguage();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const Label = styled(
        ({ children, className }: { children?: React.ReactNode; className?: string }) => {
            const formControlContext = useFormControlContext();
            const [dirty, setDirty] = useState(false);

            useEffect(() => {
                if (formControlContext?.value) {
                    setDirty(true);
                }
            }, [formControlContext]);

            if (!formControlContext) {
                return <p>{children}</p>;
            }

            const { required, value } = formControlContext;
            const showRequiredError = dirty && required && !value;

            return (
                <p className={clsx(className || showRequiredError ? 'invalid' : '')}>
                    {children}
                    {required ? <span className="text-red-500"> *</span> : ''}
                </p>
            );
        },
    )`
        font-family: 'Pretendard', sans-serif;
        font-size: 0.875rem;
        color: ${isDarkMode ? '#fff' : '#000'};
      
        &.invalid {
          color: red;
        }
      `;

    return (
        <FormControl required variant="standard" className="md:max-w-screen-md w-full">
            <Label>{phrase(dictionary, "nickname", language)}</Label>
            <TextField
                value={value}
                onChange={onChange}
                name="nickname"
                placeholder="Write your Nickname here"
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
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#DE2B74',
                            boxShadow: `${alpha('#DE2B74', 0.25)} 0 0 0 0.2rem`,
                        },
                        '& .MuiInputBase-input': {
                            width: '100%',
                            borderRadius: '0px',
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
            <FormHelperText error={value.length > 20}>
                {value.length > 20 ? "Nickname cannot exceed 20 characters." : ""}
            </FormHelperText>
        </FormControl>
    )
}

export default NewUserNicknameComponent;