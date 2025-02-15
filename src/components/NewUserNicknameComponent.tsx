"use client"

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import '@/styles/new_user.css'
import { FormControl, useFormControlContext } from '@mui/base/FormControl';
import { Input, inputClasses } from '@mui/base/Input';
import { useTheme } from "@/contexts/providers";
import { styled } from '@mui/system';
import clsx from 'clsx';
const NewUserNicknameComponent = () => {
    const { dictionary, language } = useLanguage();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const StyledInput = styled(Input)(
        ({ theme }) => `
        .${inputClasses.input} {
          width: 100%;
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.5;
          padding: 8px 12px;
          border-radius: 8px;
          color: ${isDarkMode ? '#fff' : '#000'};
          background: ${isDarkMode ? '#000' : '#fff'};
          border: 1px solid ${isDarkMode ? '#fff' : '#000'};
          box-shadow: 0 2px 2px ${isDarkMode ? '#211F21' : '#eee'};
      
          &:hover {
            border-color: ${isDarkMode ? '#DE2B74' : '#DE2B74'};
          }
      
          &:focus {
            outline: 0;
            border-color: ${isDarkMode ? '#DE2B74' : '#DE2B74'};
            box-shadow: 0;
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
                    {required ? ' *' : ''}
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
        <FormControl defaultValue="" required>
            <Label>{phrase(dictionary, "nickname", language)}</Label>
            <StyledInput name="nickname" placeholder="Write your Nickname here" />
            <HelperText />
        </FormControl >
    )
}

export default NewUserNicknameComponent;