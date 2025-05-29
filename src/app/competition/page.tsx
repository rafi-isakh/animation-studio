import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/utils/urls"

const CompetitionPage = () => {
    return (
        <div className="md:max-w-screen-xl w-full mx-auto">

            <div className="flex flex-col items-center justify-center bg-[#FFCCD7]  w-full h-full border-y-8 border-[#FF8197]">
                <Image
                    src={getImageUrl('toonyz_2025_contest_header.webp')}
                    alt="Contest Header"
                    width={900}
                    height={500}
                    className='pt-10'
                />

                <div className="flex flex-col gap-10 w-full md:px-10 md:pb-10 ">
                    <div className="w-full h-full md:p-20 p-10 flex flex-col items-center justify-center border-4 border-white bg-white rounded-xl ">

                        <div className="md:w-[900px] w-full flex flex-col md:flex-row justify-evenly gap-6">
                            {/* Left Column */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded text-center md:w-[350px] w-full text-xl">공모전 기간</div>
                                <div className="text-gray-800 text-center text-lg">
                                    <p>6월 02일(월) 09:00시</p>
                                    <p>~ 7월 04일(금) 18:00시</p>
                                </div>
                                <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded text-center mt-2 md:w-[350px] w-full text-xl">참가 자격</div>
                                <div className="text-gray-800 text-lg md:px-10">
                                    <p>누구나 참여할 수 있습니다.</p>
                                    <p>신작만 응모 가능합니다.</p>
                                    <p>- 글과 그림이 제출되지 않은 작품</p>
                                    <p>- 유료로 공개된 이력이 없는 작품</p>
                                    <p>- 정글 제한 없음</p>
                                    <p>(로맨스, 판타지, 무협, SF, 공포, BL,</p>
                                    <p>19금 등 모든 장르 환영)</p>
                                </div>
                            </div>

                            {/* Middle - Pixel Art */}
                            <div className="flex items-center justify-center">
                                <div className="relative w-full">

                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded text-center md:w-[350px] w-full  text-xl">결과 발표</div>
                                <div className="text-gray-800 text-center text-lg">
                                    <p>7월 30일(수) 09:00시</p>
                                    <p>toonyz.com 홈페이지에서 확인</p>
                                </div>
                                <div className="bg-[#FF8197] text-white font-bold py-1 px-4 rounded text-center mt-2 md:w-[350px] w-full  text-xl">상금</div>
                                <div className="flex flex-col justify-center items-center mt-2 text-lg">
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
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="w-full h-full bg-[#FF8197] py-10 rounded-xl">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-1 space-y-4 text-xl leading-relaxed px-10 break-keep ">
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
                                    이제, 당신의 이야 기로 세상을 놀라게 해보세요.
                                    <br />
                                    투니즈는 언제나 작가님을 기다리고 있습니다.
                                </p>


                            </div>

                        </div>
                    </div>

                    <div className="w-full h-full bg-transparent py-10 text-center">
                        {/* <div className="relative w-full h-full"
                            style={{
                                backgroundImage: `url(${getImageUrl('toonyz_2025_contest_footer.webp')})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <Image
                                    src={getImageUrl('toonyz_2025_contest_footer.webp')}
                                    alt="Contest Footer"
                                    width={900}
                                    height={500}
                                    className="absolute top-0 left-0"
                                /> */}
                        {/* </div> */}

                        <p className="text-2xl text-black dark:text-black font-bold"> 자세한 사항은</p>
                        <p className="text-2xl bg-[#FF8197]rounded-lg p-2 font-bold w-fit mx-auto">toonyz.com/competition</p>
                        <p className="text-2xl text-black dark:text-black font-bold">에서 확인할 수 있습니다</p>
                        <p className="text-2xl text-black dark:text-black font-bold"> 문의: hello@stelland.co.kr</p>
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