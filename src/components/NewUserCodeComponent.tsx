"use client"
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { FormControl, useFormControlContext } from '@mui/base/FormControl';
import { Input, inputClasses } from '@mui/base/Input';
import { useTheme } from "@/contexts/providers";
import { alpha, styled } from '@mui/material/styles';
import clsx from 'clsx';

const NewUserNicknameComponent = ({
  value,
  onChange,
}: {
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
  // text-sm font-medium
    font-family: 'Pretendard', sans-serif;
    font-size: 0.875rem;
    margin-bottom: 4px;
    color: ${isDarkMode ? '#fff' : '#000'};
  
    &.invalid {
      color: red;
    }
  `;

  return (
    <FormControl defaultValue="" className="md:max-w-screen-md w-full">
      <Label>{phrase(dictionary, "promotion", language)}</Label>
      <StyledInput 
        value={value}
        onChange={onChange}
        name="promoCode" 
        placeholder="Write your Promo Code here" 
      />
    </FormControl>
  )
}

export default NewUserNicknameComponent;