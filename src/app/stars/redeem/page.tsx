'use client'
import { useLanguage } from '@/contexts/LanguageContext'
import { phrase } from '@/utils/phrases'
import Link from 'next/link'
import { ChevronLeft, MoveLeft } from 'lucide-react'
import { Input } from '@/components/shadcnUI/Input'
import { Label } from '@/components/shadcnUI/Label'
import { Button } from '@/components/shadcnUI/Button'
import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'


export default function RedeemPage () {
    const { dictionary, language } = useLanguage()
    const [code, setCode] = useState("")
    const { setInvokeCheckUser } = useUser()

    const handleApplyCode = async () => {
        const checkResponse = await fetch(`/api/check_promo_code`, {
            method: "POST",
            body: JSON.stringify({ code }),
        });
        if (!checkResponse.ok) {
            throw new Error(`Failed to check promo code: ${checkResponse.statusText} ${checkResponse.status}`);
        }
        const checkData = await checkResponse.json();
        if (!checkData) { // invalid promo code
            alert(phrase(dictionary, "invalid_promo_code", language))
            return
        }
        const res = await fetch(`/api/apply_promo_code`, {
            method: "POST",
            body: JSON.stringify({ code }),
        });
        if (!res.ok) {
            alert(phrase(dictionary, "already_applied_promo_code", language))
            return
        }
        setInvokeCheckUser(prev => !prev)
        alert(phrase(dictionary, "promo_code_applied", language))
    }

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
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Button variant='outline' onClick={handleApplyCode} className='w-full'>
                            {phrase(dictionary, "apply_code", language)}
                        </Button>
                    </div>
                </div>

            </div>
        </div >
    )
}
