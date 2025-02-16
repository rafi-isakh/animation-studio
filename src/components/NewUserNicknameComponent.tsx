"use client"

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { FormControl, useFormControlContext } from '@mui/base/FormControl';
import { Input, inputClasses } from '@mui/base/Input';
import { useTheme } from "@/contexts/providers";
import { alpha, styled } from '@mui/material/styles';
import clsx from 'clsx';
import { Box } from "@mui/material";
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

    const StyledInput = styled(Input)(
        ({ theme }) => `
        .${inputClasses.input} {
          width: 100%;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s ease-in-out;
          color: ${isDarkMode ? '#fff' : '#000'};
          background: ${isDarkMode ? '#1A2027' : '#F3F6F9'};
          border: 2px solid ${isDarkMode ? '#2D3843' : '#E0E3E7'};
      
          &:hover {
            border-color: ${isDarkMode ? '#DE2B74' : '#DE2B74'};
          }
      
          &:focus {
            outline: 0;
            border-color: ${isDarkMode ? '#DE2B74' : '#DE2B74'};
            box-shadow: ${alpha('#DE2B74', 0.25)} 0 0 0 0.2rem;
          }
        }
      `,
    );

    const Label = styled(
        ({ children, className }: { children?: React.ReactNode; className?: string }) => {
            const formControlContext = useFormControlContext();
            const [dirty, setDirty] = useState(false);

            useEffect(() => {
                if (formControlContext?.filled) {
                    setDirty(true);
                }
            }, [formControlContext]);

            if (formControlContext === undefined) {
                return <p>{children}</p>;
            }

            const { error, required, filled } = formControlContext;
            const showRequiredError = dirty && required && !filled;

            return (
                <p className={clsx(className, error || showRequiredError ? 'invalid' : '')}>
                    {children}
                    {required ? <span className="text-red-500"> *</span> : ''}
                </p>
            );
        },
    )`
        font-family: 'Pretendard', sans-serif;
        font-size: 0.875rem;
        margin-bottom: 4px;
        color: ${isDarkMode ? '#fff' : '#000'};
      
        &.invalid {
          color: red;
        }
      `;

    const HelperText = styled((props: {}) => {
        const formControlContext = useFormControlContext();
        const [dirty, setDirty] = React.useState(false);
        const [value, setValue] = React.useState('');

        React.useEffect(() => {
            if (formControlContext?.filled) {
                setDirty(true);
                setValue(formControlContext.value?.toString() || '');
            }
        }, [formControlContext]);

        if (formControlContext === undefined) {
            return null;
        }

        const { required, filled } = formControlContext;
        const showRequiredError = dirty && required && !filled;
        const showLengthError = value.length > 25;

        return (
            <>
                {showRequiredError && <p {...props}>This field is required.</p>}
                {showLengthError && <p {...props}>Nickname cannot exceed 25 characters.</p>}
            </>
        );


    })`
        font-family: 'Pretendard', sans-serif;
        color: red;
        font-size: 0.875rem;
      `;

    return (
        <FormControl defaultValue="" className="md:max-w-screen-md w-full">
            <Label>{phrase(dictionary, "nickname", language)}</Label>
            <StyledInput
                value={value}
                name="nickname"
                placeholder="Write your Nickname here"
            />
            <HelperText />
        </FormControl >
    )
}

export default NewUserNicknameComponent;