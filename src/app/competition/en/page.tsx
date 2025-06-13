'use client'
import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/utils/urls"
import { useMediaQuery } from "@mui/material"
import { useLanguage } from "@/contexts/LanguageContext"

const CompetitionPage = () => {
    const { dictionary, language } = useLanguage();
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="md:max-w-screen-xl w-full mx-auto">
            <div className={`flex flex-col items-center justify-center border-[#80D1F4] bg-[#BBEDFF] w-full h-full border-b-8 `}>
                <Image
                    src={getImageUrl('toonyz_2025_onepick_header_en.webp')}
                    alt="Contest Header"
                    width={900}
                    height={500}
                    className='pt-10'
                />
                <div className="flex flex-col gap-10 w-full md:px-10 md:pb-10 gowun-batang">
                    <div className="md:w-[900px] mx-auto w-full h-full md:p-20 p-10 flex flex-col items-center justify-center border-4 border-white bg-white rounded-xl ">
                        <div className="md:w-[700px] w-full flex flex-col justify-center gap-6">
                            {/* Left Column */}
                            <div className='md:w-[700px] w-full flex flex-col justify-center gap-6'>
                                <div className='text-gray-800 relative z-10'>
                                    <div className="text-gray-800 text-left text-lg w-fit z-10">
                                        Global Top One Pick Web Novel Contest <br />
                                        It&apos;s your turn. Let the world hear your story.
                                    </div>
                                    <Image
                                        src={getImageUrl('toonyz_2025_onepick_icon4.webp')}
                                        alt='stelland star logo'
                                        width={isDesktop ? 100 : 30}
                                        height={isDesktop ? 100 : 30}
                                        className="absolute right-1 top-1 -z-10 "
                                    />
                                </div >
                                <div className="flex flex-col gap-4">
                                    <div className="bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full text-xl">
                                       1. Contest Period
                                    </div>
                                    <div className="text-gray-800 text-left text-lg w-fit pl-4">
                                        <p>From: Friday June 13th, 9:00 (KST)</p>
                                        <p>To: Thursday August 14st, 18:00 (KST)</p>
                                    </div>
                                    <div className="bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full  text-xl">
                                        2. Result Announcement
                                    </div>
                                    <div className="text-gray-800 text-left text-lg w-fit pl-4">
                                       <p>Monday, August 18, 09:00 (KST)</p>
                                       <p>Check toonyz.com for the results</p>
                                    </div>
                                    <div className="bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left text-center mt-2 md:w-[280px] w-full text-xl">
                                       3. Eligibility
                                    </div>
                                    <div className="relative text-gray-800 text-left text-lg md:px-10 w-fit md:w-[650px]">
                                        <p>Anyone can participate.</p>
                                        <p>Only unpublished and uncontracted works are eligible.</p>
                                        <p className='text-[#696969]'>- Only works that have never been under a publication contract are eligible.</p>
                                        <p className='text-[#696969]'>- Only works that have never been released as paid content are eligible.</p>
                                        <p className='text-[#696969]'>- All genres are welcome!</p>
                                        <p className='text-[#696969]'>Romance, Fantasy, Wuxia, Sci-Fi, Horror, BL, R-rated, etc.</p>
                                        <p></p>
                                        <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon2.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 100}
                                            height={isDesktop ? 150 : 100}
                                            className="absolute right-1 top-10 -z-5 md:block hidden"
                                        />
                                    </div>

                                    <div className="bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left  text-center mt-2 md:w-[280px] w-full text-xl">
                                        4. How to Participate
                                    </div>
                                    <div className="text-gray-800 text-left text-lg md:px-10 w-fit md:w-[650px]">
                                        <p>
                                            Publish your work on Toonyz during the contest period using the
                                             <Link href='/new_webnovel' className="text-[#80D1F4] font-semibold">[Submit New Story]</Link> button. <br />
                                        </p>
                                        <p className='text-[#696969]'>- Only entries with a completed application and 10 or more chapters published will be considered.</p>
                                        <p className='text-[#696969]'>- Each chapter must be at least 5,000 characters (including spaces), totaling at least 50,000 characters across 10 chapters.</p>
                                        <p className='text-[#696969]'>- Only one submission per participant will be judged.</p>
                                        <p className='text-[#696969]'>- Selected creators will be contacted individually to proceed with an official contract</p>
                                        <p className='text-[#696969]'>- Submitting a contest application is required (see “How to Apply”).</p>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col gap-4">
                                    <div className=" bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left text-center mt-2 md:w-[280px] w-full  text-xl">
                                        5. Prizes
                                    </div>
                                    <div className="relative  w-full md:w-[280px] flex flex-col justify-center items-center mt-2 text-lg">
                                        <div className="grid grid-cols-3 items-center w-full">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">Grand Prize</span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>1 winner</span>
                                            </div>
                                            <div className="bg-[#BBEDFF] rounded-lg p-2 text-center">
                                                <p className={`font-bold text-black dark:text-black text-sm`}>
                                                  $1000
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center w-full mt-2 ">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black text-md">Runner-Up</span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>2 winners</span>
                                            </div>
                                            <div className="bg-[#BBEDFF] rounded-lg p-2 text-center">
                                                <p className={`font-bold text-black dark:text-black text-sm`}>
                                                   $500 each
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center w-full mt-2">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">Honorable Mention</span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>2 winners</span>
                                            </div>
                                            <div className="bg-[#BBEDFF] rounded-lg p-2 text-center">
                                                <p className={`font-bold text-black dark:text-black text-sm`}>
                                                   $200 each
                                                </p>
                                            </div>
                                        </div>
                                        <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon1.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 100}
                                            height={isDesktop ? 150 : 100}
                                            className="absolute -right-40 top-1 -z-5 md:block hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/*  Benefits */}
                            <div className="flex flex-row gap-4">
                                <div className="mb-6">
                                    <div className="bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full text-xl">
                                        6. Winner Benefits
                                    </div>
                                    <div className="pt-4 pl-4 space-y-2 text-gray-800">
                                        <p>1) Professional Korean-English translation and editing (with potential expansion into additional languages)</p>
                                        <p>2) Launch on major global platforms (e.g. Amazon, Webnovel, Tapas, and more)</p>
                                        <p>3) Feedback from renowned writers</p>
                                        <p>4) Opportunity for print publication</p>
                                        <p>5) Potential webtoon adaptation</p>
                                    </div>
                                </div>
                            </div>


                            {/* Second Section - Important Notices */}
                            <div className="mb-6">
                                <div className="relative bg-[#80D1F4] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full  text-xl">
                                   7. Important Notes

                                </div>
                                <div className="relative pt-4 pl-4 space-y-4 text-gray-800">
                                    <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon3.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 50}
                                            height={isDesktop ? 150 : 50}
                                            className="absolute right-1 top-1 -z-5 "
                                        />
                                    <p>Please read carefully before submitting</p>

                                    <div>
                                        <p className="font-semibold">1) Copyright</p>
                                        <p className="pl-4 text-[#696969]">- All copyrights remain with the original creators.</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">2) Submission Limits</p>
                                        <p className="pl-4 text-[#696969]">- Multiple submissions are allowed, but only one work per writer will be evaluated.</p>
                                        <p className="pl-4 text-[#696969]">- Submission is complete only after clicking the “Apply to Contest” button.</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">3) Simultaneous serialization</p>
                                        <p className="pl-4 text-[#696969]">- Works published on other platforms may be submitted, as long as they are not currently under contract.</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">4) Prize payment and publication guidelines</p>
                                        <p className="pl-4 text-[#696969]">- Winners must agree to Toonyz&apos;s terms of use and participate in an interview before receiving prize money.</p>
                                        <p className="pl-4 text-[#696969]">- All prizes are paid in cash. Taxes and fees are the responsibility of the recipient.</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">5) Judging Criteria</p>
                                        <p className="pl-4 text-[#696969]">- Depending on the judging results, some awards may not be granted.</p>
                                        <p className="pl-4 text-[#696969]">- Entries may be disqualified or have prizes revoked if they fall under any of the following:</p>

                                        <ul className="pl-8 mt-2 space-y-1 text-gray-800">
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Derivative works using others&apos; IP</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Works already under contract with other platforms/publishers/distributors</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Works with transferred or pledged copyrights</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Works that have already won prizes in other competitions</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Works found to violate intellectual property rights (copyrights, trademarks, etc.)</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <p className="mt-4">
                                        Toonyz values the rights of creators and upholds a fair and transparent judging process based on these criteria.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="md:w-[900px] mx-auto w-full h-full bg-[#80D1F4] py-10 rounded-xl text-white dark:text-white">
                        <div className="relative flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-1 space-y-4 text-xl leading-relaxed px-10 break-keep z-10 font-semibold">
                                <p>
                                    Toonyz believes that great stories are the foundation of a strong platform.<br/> 
                                    As meaningful stories grow, so does the community of writers and readers who gather around them.
                                </p>

                                <p>
                                    We want to find the kind of content we truly believe in, and to support its creators with the recognition and rewards they deserve.
                                </p>

                                <p>
                                   We don&apos;t want this to end with a single contract.
                                   We believe that a story built through steady, sincere serialization has the power to transform an entire platform.
                                  
                                </p>

                                <p>
                                  Your growth is Toonyz&apos;s growth.
                                  Together, let this contest become the first step toward a sustainable creative future. 
                                </p>

                                <p className="font-bold">
                                    Let your stories make the world a surprise.
                                    <br />
                                    Toonyz is always waiting for your stories.
                                </p>
                            </div>
                            <Image
                                src={getImageUrl('toonyz_2025_contest_star.webp')}
                                alt="Contest Author"
                                width={200}
                                height={200}
                                className="absolute bottom-0 right-0 -z-1"
                            />
                        </div>
                    </div>

                    <div className="relative md:w-[900px] w-full mx-auto flex justify-between items-center bg-white text-center rounded-xl" >
                        <div className="flex-1 z-10 py-20 px-10 flex flex-col items-center justify-center">
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> For more information, please visit</p>
                            <p className="md:text-2xl text-xs bg-[#80D1F4] rounded-lg p-2 font-bold w-fit mx-auto">toonyz.com/competition/en</p>
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> for more information.</p>
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> Contact: hello@stelland.io</p>
                        </div>
                        <Image
                            src='/stelland_logo.svg'
                            alt='stelland star logo'
                            width={isDesktop ? 150 : 100}
                            height={isDesktop ? 150 : 100}
                            className="absolute right-5 -z-5"
                        />
                    </div>

                    <div className="flex flex-col items-center justify-center py-10 pb-40">
                        <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfAj9NjXVLrTScaVA6YOoe7DpmG_qwo_MDZNAVSA67Ch10WxQ/viewform" target="_blank">
                            <Image
                                src={getImageUrl('toonyz_2025_contest_button_en.webp')}
                                alt="Contest Applying Button"
                                width={400}
                                height={200}
                                className="cursor-pointer mx-auto"
                            />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CompetitionPage
