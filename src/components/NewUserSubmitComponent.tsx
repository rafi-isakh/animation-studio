"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { Button, ThemeProvider } from "@mui/material";
import { bwTheme, grayTheme } from "@/styles/BlackWhiteButtonStyle";


const NewUserSubmitComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <ThemeProvider theme={grayTheme}>
            <Button
                type="submit"
                variant="contained"
                color="gray"
            >
                {phrase(dictionary, "register", language)}
            </Button>
        </ThemeProvider>
    )
}

export default NewUserSubmitComponent;
