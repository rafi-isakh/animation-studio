"use client"
import DictionaryPhrase from '@/components/DictionaryPhrase';
import SignInComponent from '@/components/SignInComponent';
import { useEffect, useState } from 'react';
import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from 'react-confetti'


export default function SignIn() {
  const { width, height } = useWindowSize()
  const [confettiWidth, setConfettiWidth] = useState(width);
  const [confettiHeight, setConfettiHeight] = useState(height);

  useEffect(() => {
    setConfettiWidth(width * 1.0001)
    setConfettiHeight(height * 1.0001)
}, [width, height])

  return (
    <div className='flex flex-col items-center justify-center h-[70vh] !p-10'>
      <div className='flex justify-center items-center w-full'>
        <Confetti
            width={confettiWidth}
            height={confettiHeight}
            recycle={false}
            className='mx-auto'
        />
    </div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          <DictionaryPhrase phraseVar="sign_in_to_receive_stars" />
        </h1>
      </div>
      <SignInComponent redirectTo="/marketing_consent" />
    </div>
  );

}
