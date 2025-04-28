"use client"

import { useState, useEffect } from "react"
import Image from 'next/image'
import { Avatar, AvatarFallback } from "@/components/shadcnUI/Avatar"
import { EmailForm } from "@/components/UI/booktok/EmailForm"

export function EmailSignupPage() {


    return (
        <div className="w-full md:max-w-screen-lg mx-auto p-8 flex flex-col justify-between">

            <div className="flex md:flex-row flex-col w-full gap-10">

                <div className="flex flex-col justify-center items-center">
                    <div className="flex flex-col justify-center items-center">
                        <Image src='/toonyz_logo_pink.svg' alt="Toonyz Logo" width={100} height={100} className="self-center py-6" />

                        <p className="text-lg sm:text-xl mb-4 text-black text-center">
                            Bring Stories to Life with Toonyz!
                        </p>
                        <h2 className="text-2xl sm:text-5xl font-extrabold mb-4 text-black text-center">
                            BookTok Creator Campaign
                        </h2>
                    </div>
                    <div>
                        <p className="text-lg sm:text-xl mb-8 text-black">
                            We are launching a special BookTok creator campaign and would love to collaborate with you!

                        </p>
                    </div>
                    <div className="w-full">
                        <EmailForm />
                    </div>

                </div>
                <Image src='/images/toa-heftiba-2NZQmMLo_7Q-unsplash.webp' alt="Toonyz BookTok Creator Campaign" width={500} height={500} />

            </div>
            <div className="flex flex-col mt-16 justify-center items-center gap-8">
                <Image src='/images/N_logo.svg' alt="Toonyz Logo" width={30} height={30} className="self-center p-1 border border-gray-200 rounded-lg" />
                <h1 className="text-xl font-extrabold mb-4 text-black text-center">
                    Join Toonyz Visual Storytelling Movement! <br />
                    We are looking for your collaboration
                </h1>

                <p className="text-lg sm:text-xl mb-8 text-black">
                    We invite you a BookTok creator to help readers see their favorite characters with stunning AI-generated visuals and animations.
                </p>



                <div>
                    <h1 className="text-xl font-extrabold mb-4 text-black text-center">
                        How it works?
                    </h1>
                    <ol className="text-lg sm:text-xl mb-8 text-black list-decimal list-inside">
                        <li>Sign up and fill out your email address in the form above</li>
                        <li>We will get back to you soon as soon as possible.</li>
                        <li>While you are waiting, Join Toonyz and Pick a web novel and explore its visuals and animations.</li>
                    </ol>
                    <p className="text-lg sm:text-xl mb-8 text-black">
                        Suggested Hashtags:
                        <br />
                        <span className="font-bold text-[#DE2E8A]"> #ToonyzBookTok #MyToonyzHero #WebnovelVisuals #BookTok</span>
                    </p>


                </div>
            </div>
        </div>
    )
}
