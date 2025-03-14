'use client'
import { useLanguage } from '@/contexts/LanguageContext'
import { phrase } from '@/utils/phrases'
import Link from 'next/link'
import { ChevronLeft, MoveLeft } from 'lucide-react'
import { Input } from '@/components/shadcnUI/Input'
import { Label } from '@/components/shadcnUI/Label'
import { Button } from '@/components/shadcnUI/Button'


export const ReedemCodePage = () => {
    const { dictionary, language } = useLanguage()

    return (
        <div className="flex flex-col md:max-w-screen-md w-full mx-auto">
            <div className="flex flex-col w-full gap-2">
                <Link href="/stars" className="items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors my-4 self-start md:flex hidden">
                    <MoveLeft size={20} className='dark:text-white text-gray-500' />
                    <p className="text-sm font-base">Back</p>
                </Link>
                <h1 className="text-2xl font-extrabold text-center">
                    {/* Redeem code */}
                    {phrase(dictionary, "redeem_code", language)}
                </h1>
                <div className="flex flex-col mx-auto justify-center items-center w-full gap-2 pt-5">

                    <h2>{phrase(dictionary, "redeem_code_subtitle", language)}</h2>

                    <div className='md:w-[360px] w-[200px] mx-auto flex flex-col gap-2'>
                        <Label> </Label>
                        <Input 
                            placeholder={phrase(dictionary, "enter_code", language)}
                            className='w-full'
                        />
                        <Button variant='outline' disabled className='w-full'>
                            {phrase(dictionary, "apply_code", language)}
                        </Button>
                    </div>
                </div>

            </div>
        </div >
    )
}

export default ReedemCodePage