"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { Button, ThemeProvider } from "@mui/material";
import { bwTheme, grayTheme, NoCapsButton } from "@/styles/BlackWhiteButtonStyle";


const NewUserSubmitComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <ThemeProvider theme={grayTheme}>
            <NoCapsButton
                className='w-32 mx-auto'
                type="submit"
                variant="outlined"
                color="gray"
            >
                {phrase(dictionary, "register", language)}
            </NoCapsButton>
        </ThemeProvider>
    )
}

export default NewUserSubmitComponent;
