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

            <div className="flex flex-col items-center justify-center bg-[#FFCCD7]  w-full h-full border-b-8 border-[#FF8197]">
                {language === 'ko' ? <Image
                    src={getImageUrl('toonyz_2025_onepick_header.webp')}
                    alt="Contest Header"
                    width={900}
                    height={500}
                    className='pt-10'
                /> : <Image
                    src={getImageUrl('toonyz_2025_onepick_header_en.webp')}
                    alt="Contest Header"
                    width={900}
                    height={500}
                    className='pt-10'
                />}

                <div className="flex flex-col gap-10 w-full md:px-10 md:pb-10 gowun-batang">
                    <div className="md:w-[900px] mx-auto w-full h-full md:p-20 p-10 flex flex-col items-center justify-center border-4 border-white bg-white rounded-xl ">
                        <div className="md:w-[700px] w-full flex flex-col justify-center gap-6">
                            {/* Left Column */}
                            <div className='md:w-[700px] w-full flex flex-col justify-center gap-6'>
                                <div className='text-gray-800 relative z-10'>
                                    <div className="text-gray-800 text-left text-lg w-fit z-10">
                                        {language === 'ko' ? '투니즈 글로벌 웹소설 공모전' : 'Global Top Pick Web Novel Contest'} <br />
                                        {language === 'ko' ? '지금, 작가님의 새로운 이야기가 세상에 나올 차례입니다.' 
                                         : 'It\'s your turn. Let the world hear your story.'}
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
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full text-xl">
                                        {language === 'ko' ? '1. 공모전 기간' : '1. Contest Period:'}
                                    </div>
                                    <div className="text-gray-800 text-left text-lg w-fit pl-4">
                                        <p>{language === 'ko' ? '5월 30일(금) 09:00시 ~' : 'From: Friday, May 30th, 09:00 (KST)'}</p>
                                        <p>{language === 'ko' ? '7월 31일(목) 18:00시' : 'To: Thursday, July 31st, 18:00 (KST)'}</p>
                                    </div>
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full  text-xl">
                                        {language === 'ko' ? '2. 결과 발표' : '2. Result Announcement:'}
                                    </div>
                                    <div className="text-gray-800 text-left text-lg w-fit pl-4">
                                        <p>{language === 'ko' ? '8월 18일(월) 09:00시' : 'Monday, August 18, 09:00 (KST)'}</p>
                                        <p>{language === 'ko' ? 'toonyz.com 홈페이지에서 확인' : 'Check toonyz.com for the results'}</p>
                                    </div>
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center mt-2 md:w-[280px] w-full text-xl">
                                        {language === 'ko' ? '3. 참가 자격' : '3. Eligibility:'}
                                    </div>
                                    <div className="relative text-gray-800 text-left text-lg md:px-10 w-fit md:w-[650px]">
                                        <p>{language === 'ko' ? '누구나 참여할 수 있습니다.' : 'Anyone can participate.'}</p>
                                        <p>{language === 'ko' ? '계약한 적 없는 작품만 응모 가능합니다.' : 'Only unpublished and uncontracted works are eligible.'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 출판 계약이 체결된 적 없는 작품' : '- Only works that have never been under a publication contract are eligible.'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 유료로 공개된 이력이 없는 작품' : '- Only works that have never been released as paid content are eligible.'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 장르 제한 없음' : 'All genres are welcome!'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '(로맨스, 판타지, 무협, SF, 공포, BL, 19금 등 모든 장르 환영)' : 'Romance, Fantasy, Wuxia, Sci-Fi, Horror, BL, R-rated, etc.'}</p>
                                        <p></p>
                                        <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon2.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 100}
                                            height={isDesktop ? 150 : 100}
                                            className="absolute right-1 top-10 -z-5 md:block hidden"
                                        />
                                    </div>

                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left  text-center mt-2 md:w-[280px] w-full text-xl">
                                        {language === 'ko' ? '4. 참여 방법' : '4. How to Participate:'}
                                    </div>
                                    <div className="text-gray-800 text-left text-lg md:px-10 w-fit md:w-[650px]">
                                        <p>
                                            {language === 'ko' ? <>투니즈에서 공모기간 동안
                                            <Link href='/new_webnovel' className="text-[#FF8197] font-semibold">[새 작품 등록하기]</Link>를 통해  자유 연재 <br /></>
                                             : <>Publish your work on Toonyz during the contest period using the
                                             <Link href='/new_webnovel' className="text-[#FF8197] font-semibold">[Submit New Story]</Link> button. <br /></>}
                                        </p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 공모전 참가 신청 후 10화 이상 연재 시 심사 대상에 포함' 
                                        : '- Only entries with a completed application and 10 or more chapters published will be considered.'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 회차별 분량은 공백 포함 5,000자 기준, 10화 50,000자 이상 작성 필수' 
                                        : '- Each chapter must be at least 5,000 characters (including spaces), totaling at least 50,000 characters across 10 chapters.'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 1인 1작품 심사' 
                                        : '- Only one submission per participant will be judged.'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 선정된 작품은 개별 연락 후, 정식 계약 체결' 
                                        : '- Selected creators will be contacted individually to proceed with an official contract'}</p>
                                        <p className='text-[#696969]'>{language === 'ko' ? '- 참가 신청 필수(참가 신청 방법 )' 
                                        : '- Submitting a contest application is required (see “How to Apply”).'}</p>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col gap-4">
                                    <div className=" bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center mt-2 md:w-[280px] w-full  text-xl">
                                        {language === 'ko' ? '5. 상금' : '5. Prizes:'}
                                    </div>
                                    <div className="relative  w-full md:w-[280px] flex flex-col justify-center items-center mt-2 text-lg">
                                        <div className="grid grid-cols-3 items-center w-full">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">{language === 'ko' ? '대상' : 'Grand Prize'}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>{language === 'ko' ? '1명' : '1 winner'}</span>
                                            </div>
                                            <div className="bg-pink-200 rounded-lg p-2 text-center">
                                                <p className={`font-bold text-black dark:text-black ${language === 'ko' ? 'text-base' : 'text-sm'}`}>
                                                    {language === 'ko' ? '100만원' : '₩1,000,000'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center w-full mt-2 ">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black text-md">{language === 'ko' ? '최우수상' : 'Runner-Up'}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>{language === 'ko' ? '2명' : '2 winners'}</span>
                                            </div>
                                            <div className="bg-pink-200 rounded-lg p-2 text-center">
                                                <p className={`font-bold text-black dark:text-black ${language === 'ko' ? 'text-base' : 'text-sm'}`}>
                                                    {language === 'ko' ? '각 50만원' : '₩500,000 each'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center w-full mt-2">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">{language === 'ko' ? '우수상' : 'Honorable Mention'}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>{language === 'ko' ? '4명' : '4 winners'}</span>
                                            </div>
                                            <div className="bg-pink-200 rounded-lg p-2 text-center">
                                                <p className={`font-bold text-black dark:text-black ${language === 'ko' ? 'text-base' : 'text-sm'}`}>
                                                    {language === 'ko' ? '각 30만원' : '₩300,000 each'}
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
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full text-xl">
                                        {language === 'ko' ? '6. 수상자 혜택' : '6. Winner Benefits:'}
                                    </div>
                                    <div className="pt-4 pl-4 space-y-2 text-gray-800">
                                        <p>{language === 'ko' ? '1) 영어 번역 검수(계약 이후, 타언어 번역 확장 가능)' : '1) Professional Korean-English translation and editing (with potential expansion into additional languages)'}</p>
                                        <p>{language === 'ko' ? '2) 해외 유명 플랫폼 런칭 ex)아마존, webnovel, 타파스 등' : '2) Launch on major global platforms (e.g. Amazon, Webnovel, Tapas, and more)'}</p>
                                        <p>{language === 'ko' ? '3) 유명 작가 피드백' : '3) Feedback from renowned writers'}</p>
                                        <p>{language === 'ko' ? '4) 단행본 출판' : '4) Opportunity for print publication'}</p>
                                        <p>{language === 'ko' ? '5) 웹툰화' : '5) Potential webtoon adaptation'}</p>
                                    </div>
                                </div>
                            </div>


                            {/* Second Section - Important Notices */}
                            <div className="mb-6">
                                <div className="relative bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[280px] w-full  text-xl">
                                   {language === 'ko' ? '7. 유의사항' : '7. Important Notes:'}

                                </div>
                                <div className="relative pt-4 pl-4 space-y-4 text-gray-800">
                                    <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon3.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 50}
                                            height={isDesktop ? 150 : 50}
                                            className="absolute right-1 top-1 -z-5 "
                                        />
                                    <p>{language === 'ko' ? '응모 전 반드시 확인해주세요.' : 'Please read carefully before submitting:'}</p>

                                    <div>
                                        <p className="font-semibold">{language === 'ko' ? '1) 저작권' : '1) Copyright'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 응모한 모든 작품의 저작권은 창작자인 작가 본인에게 귀속됩니다.' : '- All copyrights remain with the original creators.'}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">{language === 'ko' ? '2) 작가 당 1편 심사' : '2) Submission Limits'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 한 명의 작가는 여러 작품을 올릴 수 있지만, 심사는 1인 1작품만 심사가 진행됩니다.' : '- Multiple submissions are allowed, but only one work per writer will be evaluated.'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 공모전에 응모하려면 \'공모전 참여하기\' 버튼을 눌러 참가 신청까지 완료하셔야 정식 접수됩니다.' : '-Submission is complete only after clicking the “Apply to Contest” button.'}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">{language === 'ko' ? '3) 외부 연재 여부와 관계 없이 참여 가능' : '3) Simultaneous serialization'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 이미 다른 플랫폼에 연재된 적이 있어도, 계약이 체결되지 않았다면 응모하실 수 있습니다.' : '- Works published on other platforms may be submitted, as long as they are not currently under contract.'}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">{language === 'ko' ? '4) 상금 수령 및 연재 관련 안내' : '4) Prize payment and publication guidelines'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 수상자는 본 플랫폼 이용 약관과 대면 미팅을 거쳐 정식 연재 조건에 합의한 뒤, 상금을 지급받습니다.' : '- Winners must agree to Toonyz\'s terms of use and participate in an interview before receiving prize money.'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 상금은 현금으로 지급되며, 이때 발생하는 제세공과금은 수상자 본인이 부담합니다.' : '- All prizes are paid in cash. Taxes and fees are the responsibility of the recipient.'}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold">{language === 'ko' ? '5) 심사 관련 주의사항' : '5) Judging Criteria'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 심사 결과에 따라 수상작이 선정되지 않거나, 일부 부문만 선정될 수 있습니다.' : '- Depending on the judging results, some awards may not be granted.'}</p>
                                        <p className="pl-4 text-[#696969]">{language === 'ko' ? '- 아래 항목에 해당하는 경우, 심사에서 제외되거나 수상 후에도 상금이 회수될 수 있습니다:' : '- Entries may be disqualified or have prizes revoked if they fall under any of the following:'}</p>

                                        <ul className="pl-8 mt-2 space-y-1 text-gray-800">
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{language === 'ko' ? '타인의 저작물이나 설정을 활용한 2차 창작물' : 'Derivative works using others\' IP'}</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{language === 'ko' ? '타 플랫폼, 출판사, 유통사와 이미 계약이 체결된 작품' : 'Works already under contract with other platforms/publishers/distributors'}</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{language === 'ko' ? '타인에게 저작권을 양도하거나 담보로 설정한 작품' : 'Works with transferred or pledged copyrights'}</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{language === 'ko' ? '기존 타 공모전에서 수상한 이력이 있는 작품' : 'Works that have already won prizes in other competitions'}</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{language === 'ko' ? '타인의 지식재산권(저작권, 상표권 등)을 침해한 것으로 확인되는 경우' : 'Works found to violate intellectual property rights (copyrights, trademarks, etc.)'}</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <p className="mt-4">
                                        {language === 'ko' ? '투니즈는 창작자의 권리를 소중히 여기며, 공정하고 투명한 심사를 위해 위와 같은 기준을 적용하고 있습니다.' 
                                        : 'Toonyz values the rights of creators and upholds a fair and transparent judging process based on these criteria.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="md:w-[900px] mx-auto w-full h-full bg-[#FF8197] py-10 rounded-xl text-white dark:text-white">
                        <div className="relative flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-1 space-y-4 text-xl leading-relaxed px-10 break-keep z-10 font-semibold">
                                <p>
                                    {language === 'ko' ? <>투니즈는 좋은 이야기들이 많아질수록 플랫폼은 더욱 견고해지고,
                                                         <br />그 안에 머무는 작가와 독자도 자연스럽게 늘어난다는 사실을 믿습니다.</> 
                                        : <>Toonyz believes that great stories are the foundation of a strong platform.<br/> 
                                        As meaningful stories grow, so does the community of writers and readers who gather around them.</>}
                                </p>

                                <p>
                                    {language === 'ko' ? <>저희가 정말 찾게하고 싶은 콘텐츠를 찾고, <br />
                                    그에 걸맞은 정당한 보상으로 작가님의 성장을 응원하고 싶어서 공모전을 기획하게 되었습니다.</> 
                                    : <>This contest was born from our desire to find the kind of content we truly believe in, and to support its creators with the recognition and rewards they deserve.</>}
                                </p>

                                <p>
                                    {language === 'ko' ? <>이 공모전이 단순한 계약 한 편으로 끝나지 않기를 바랍니다.
                                    <br />
                                    하루하루 성실하게 써 내려간 연재, 그 노력 끝에 완성된 한 편의 작품이
                                    <br />
                                    플랫폼 전체를 바꾸는 힘이 될 수 있다고 믿습니다. </>
                                    : <>We don’t want this to end with a single contract. <br/>
                                     We believe that a story built through steady, sincere serialization has the power to transform an entire platform.
                                    </>}
                                </p>

                                <p>
                                    {language === 'ko' ? <>작가님의 성장이 곧 투니즈의 성장입니다.<br/></> : <>Your growth is Toonyz\'s growth.</>}
                                    {language === 'ko' ? <>지속 가능한 창작 생태계를 함께 만들어가는 그 첫걸음을,
                                    <br />그 협업의 시작이 바로 이 공모전이 되길 바랍니다.
                                    </> : <>Together, let this contest become the first step toward a sustainable creative future. </>
                                    }
                                </p>

                                <p className="font-bold">
                                    {language === 'ko' ? <>이제, 작가님의 이야기로 세상을 놀라게 해보세요.<br/>
                                    투니즈는 언제나 작가님을 기다리고 있습니다.</> : <>Let your stories make the world a surprise.
                                    <br />
                                    Toonyz is always waiting for your stories.</>}
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
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> {language === 'ko' ? '자세한 사항은' : 'For more information, please visit'}</p>
                            <p className="md:text-2xl text-xs bg-[#FF8197] rounded-lg p-2 font-bold w-fit mx-auto">{language === 'ko' ? 'toonyz.com/competition' : 'toonyz.com/competition'}</p>
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> {language === 'ko' ? '에서 확인할 수 있습니다' : 'for more information.'}</p>
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> {language === 'ko' ? '문의: hello@stelland.io' : 'Contact: hello@stelland.io'}</p>
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
                                src={getImageUrl('toonyz_2025_contest_button.webp')}
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
