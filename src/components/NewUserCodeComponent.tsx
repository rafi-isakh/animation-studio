"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import '@/styles/new_user.css'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

const NewUserNicknameComponent = () => {
  const { dictionary, language } = useLanguage();

  return (
    <div className='w-full text-black dark:text-black focus:outline-none'>
      <Box
        component="form"
        sx={{
          color: 'black',
          '& .MuiTextField-root': { m: 0 },
        }}
        autoComplete="off"
      >
        <TextField
          label={phrase(dictionary, "promotion", language)}
          id="outlined-basic"
          type="text"
          name="promoCode"
          size="small"
          className='w-full'
        />
      </Box>
    </div>
  )
}

export default NewUserNicknameComponent;