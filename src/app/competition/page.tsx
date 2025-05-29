'use client'
import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/utils/urls"
import { useMediaQuery } from "@mui/material"

const CompetitionPage = () => {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="md:max-w-screen-xl w-full mx-auto">

            <div className="flex flex-col items-center justify-center bg-[#FFCCD7]  w-full h-full border-b-8 border-[#FF8197]">
                <Image
                    src={getImageUrl('toonyz_2025_onepick_header.webp')}
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
                                        투니즈 글로벌 웹소설 공모전 <br />
                                        지금, 작가님의 새로운 이야기가 세상에 나올 차례입니다.
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
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[350px] w-full text-xl">1. 공모전 기간</div>
                                    <div className="text-gray-800 text-left text-lg w-fit pl-4">
                                        <p>5월 29일(목) 09:00시</p>
                                        <p>~ 7월 31일(목) 18:00시</p>
                                    </div>
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[350px] w-full  text-xl">2. 결과 발표</div>
                                    <div className="text-gray-800 text-left text-lg w-fit pl-4">
                                        <p>8월 18일(월) 09:00시</p>
                                        <p>toonyz.com 홈페이지에서 확인</p>
                                    </div>
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center mt-2 md:w-[350px] w-full text-xl">3. 참가 자격</div>
                                    <div className="relative text-gray-800 text-left text-lg md:px-10 w-fit md:w-[650px]">
                                        <p>누구나 참여할 수 있습니다.</p>
                                        <p>계약한 적 없는 작품만 응모 가능합니다.</p>
                                        <p className='text-gray-500'>- 출판 계약이 체결된 적 없는 작품</p>
                                        <p className='text-gray-500'>- 유료로 공개된 이력이 없는 작품</p>
                                        <p className='text-gray-500'>- 장르 제한 없음</p>
                                        <p className='text-gray-500'>(로맨스, 판타지, 무협, SF, 공포, BL, 19금 등 모든 장르 환영)</p>
                                        <p></p>
                                        <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon2.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 100}
                                            height={isDesktop ? 150 : 100}
                                            className="absolute right-1 top-1 -z-5  md:block hidden"
                                        />
                                    </div>

                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left  text-center mt-2 md:w-[350px] w-full text-xl">4. 참여 방법</div>
                                    <div className="text-gray-800 text-left text-lg md:px-10 w-fit md:w-[650px]">
                                        <p>투니즈에서 공모기간 동안 [새 작품 등록하기]를 통해  자유 연재 <br />
                                            시작 기존 연재 작품은 어렵습니다. 삭제 후 재 업로드 해주셔야 합니다.</p>
                                        <p className='text-gray-500'>- 공모전 참가 신청 후 10화 이상 연재 시 심사 대상에 포함</p>
                                        <p className='text-gray-500'>- 회차별 분량은 공백 포함 5,000자 기준, 10화 50,000자 이상 작성 필수</p>
                                        <p className='text-gray-500'>- 1인 1작품 심사</p>
                                        <p className='text-gray-500'>- 선정된 작품은 개별 연락 후, 정식 계약 체결</p>
                                        <p className='text-gray-500'>- 참가 신청 필수(참가 신청 방법 )</p>

                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col gap-4">
                                    <div className=" bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center mt-2 md:w-[350px] w-full  text-xl">5. 상금</div>
                                    <div className="relative  w-full md:w-[350px] flex flex-col justify-center items-center mt-2 text-lg">
                                        <div className="grid grid-cols-3 items-center w-full">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">대상 </span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>1명</span>
                                            </div>
                                            <div className="bg-pink-200 rounded-lg p-2 text-center">
                                                <p className="font-bold text-black dark:text-black">100만원</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center w-full mt-2 ">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">최우수상 </span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>2명</span>
                                            </div>
                                            <div className="bg-pink-200 rounded-lg p-2 text-center">
                                                <p className="font-bold text-black dark:text-black">각 50만원</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 items-center w-full mt-2">
                                            <div className="text-center">
                                                <span className="font-bold text-black dark:text-black">우수상 </span>
                                            </div>
                                            <div className="text-center">
                                                <span className='text-black dark:text-black'>4명</span>
                                            </div>
                                            <div className="bg-pink-200 rounded-lg p-2 text-center">
                                                <p className="font-bold text-black dark:text-black">각 30만원</p>
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
                                    <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[350px] w-full text-xl">
                                        6. 수상자 혜택
                                    </div>
                                    <div className="pt-4 pl-4 space-y-2 text-gray-800">
                                        <p>1) 영어 번역 검수(계약 이후, 타언어 번역 확장 가능)</p>
                                        <p>2) 해외 유명 플랫폼 런칭 ex)아마존, webnovel, 타파스 등</p>
                                        <p>3) 유명 작가 피드백</p>
                                        <p>4) 단행본 출판</p>
                                        <p>5) 웹툰화</p>
                                    </div>
                                </div>
                            </div>


                            {/* Second Section - Important Notices */}
                            <div className="mb-6">
                                <div className="relative bg-[#FF8197] text-white font-bold py-1 px-4 rounded md:text-left text-center md:w-[350px] w-full  text-xl">
                                    7. 유의사항

                                </div>
                                <div className="relative pt-4 pl-4 space-y-4 text-gray-800">
                                    <Image
                                            src={getImageUrl('toonyz_2025_onepick_icon3.webp')}
                                            alt='stelland star logo'
                                            width={isDesktop ? 150 : 50}
                                            height={isDesktop ? 150 : 50}
                                            className="absolute right-1 top-1 -z-5 "
                                        />
                                    <p>응모 전 반드시 확인해주세요.</p>

                                    <div>
                                        <p>1)저작권</p>
                                        <p className="pl-4">- 응모한 모든 작품의 저작권은 창작자인 작가 본인에게 귀속됩니다.</p>
                                    </div>

                                    <div>
                                        <p>2) 작가 당 1편 심사</p>
                                        <p className="pl-4">- 한 명의 작가는 여러 작품을 올릴 수 있지만, 심사는 1인 1작품만 심사가 진행됩니다.</p>
                                        <p className="pl-4">- 공모전에 응모하려면 &apos;공모전 참여하기&apos; 버튼을 눌러 참가 신청까지 완료하셔야 정식 접수됩니다.</p>
                                    </div>

                                    <div>
                                        <p>3) 외부 연재 여부와 관계 없이 참여 가능</p>
                                        <p className="pl-4">- 이미 다른 플랫폼에 연재된 적이 있어도, 계약이 체결되지 않았다면 응모하실 수 있습니다.</p>
                                    </div>

                                    <div>
                                        <p>4) 상금 수령 및 연재 관련 안내</p>
                                        <p className="pl-4">- 수상자는 본 플랫폼 이용 약관과 대변 미팅을 거쳐 정식 연재 조건에 합의한 뒤, 상금을 지급받습니다.</p>
                                        <p className="pl-4">- 상금은 현금으로 지급되며, 이때 발생하는 제세공과금은 수상자 본인이 부담합니다.</p>
                                    </div>

                                    <div>
                                        <p>5) 심사 관련 주의사항</p>
                                        <p className="pl-4">- 심사 결과에 따라 수상작이 선정되지 않거나, 일부 부문만 선정될 수 있습니다.</p>
                                        <p className="pl-4">- 아래 항목에 해당하는 경우, 심사에서 제외되거나 수상 후에도 상금이 회수될 수 있습니다:</p>

                                        <ul className="pl-8 mt-2 space-y-1">
                                            <li className="flex items-start">
                                                <span className="mr-2">●</span>
                                                <span>타인의 저작물이나 설정을 활용한 2차 창작물</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">●</span>
                                                <span>타 플랫폼, 출판사, 유통사와 이미 계약이 체결된 작품</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">●</span>
                                                <span>타인에게 저작권을 양도하거나 담보로 설정한 작품</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">●</span>
                                                <span>기존 타 공모전에서 수상한 이력이 있는 작품</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">●</span>
                                                <span>타인의 지식재산권(저작권, 상표권 등)을 침해한 것으로 확인되는 경우</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <p className="mt-4">
                                        투니즈는 창작자의 권리를 소중히 여기며, 공정하고 투명한 심사를 위해 위와 같은 기준을 적용하고 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="md:w-[900px] mx-auto w-full h-full bg-[#FF8197] py-10 rounded-xl text-white dark:text-white">
                        <div className="relative flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-1 space-y-4 text-xl leading-relaxed px-10 break-keep z-10">
                                <p>
                                    투니즈는 좋은 이야기들이 많아질수록 플랫폼은 더욱 견고해지고,
                                    <br />그 안에 머무는 작가와 독자도 자연스럽게 늘어난다는 사실을 믿습니다.
                                </p>

                                <p>
                                    저희가 정말 찾게하고 싶은 콘텐츠를 찾고, <br />
                                    그에 걸맞은 정당한 보상으로 작가님의 성장을 응원하고 싶어서 공모전을 기획하게 되었습니다.
                                </p>

                                <p>
                                    이 공모전이 단순한 계약 한 편으로 끝나지 않기를 바랍니다.
                                    <br />
                                    하루하루 성실하게 써 내려간 연재, 그 노력 끝에 완성된 한 편의 작품이
                                    <br />
                                    플랫폼 전체를 바꾸는 힘이 될 수 있다고 믿습니다.
                                </p>

                                <p>
                                    작가님의 성장이 곧 투니즈의 성장입니다.
                                    <br />
                                    지속 가능한 창작 생태계를 함께 만들어가는 그 첫걸음을,
                                    <br />그 협업의 시작이 바로 이 공모전이 되길 바랍니다.
                                </p>

                                <p className="font-bold">
                                    이제, 작가님의 이야기로 세상을 놀라게 해보세요.
                                    <br />
                                    투니즈는 언제나 작가님을 기다리고 있습니다.
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
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> 자세한 사항은</p>
                            <p className="md:text-2xl text-xs bg-[#FF8197] rounded-lg p-2 font-bold w-fit mx-auto">toonyz.com/competition</p>
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold">에서 확인할 수 있습니다</p>
                            <p className="md:text-2xl text-xs text-black dark:text-black font-bold"> 문의: hello@stelland.co.kr</p>
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
