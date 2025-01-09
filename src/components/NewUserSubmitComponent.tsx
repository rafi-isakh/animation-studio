"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { Button, ThemeProvider } from "@mui/material";
import { bwTheme, grayTheme, NoCapsButton } from "@/styles/BlackWhiteButtonStyle";


const NewUserSubmitComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div className="relative inline-flex group w-72">
            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
            </div>
            <NoCapsButton
                sx={{
                    backgroundColor: 'white',
                    color: 'black',
                    borderRadius: '10px',
                    border: '2px solid #000',
                    padding: '10px',
                    margin: '0',
                    width: '300px',
                }}
                className='flex-shrink-1 w-full relative inline-flex items-center px-6 py-3 md:text-base text-md font-medium text-black transition-all duration-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                type="submit"
                variant="text"
            >
                {phrase(dictionary, "register", language)}
            </NoCapsButton>
        </div>
    )
}

export default NewUserSubmitComponent;
