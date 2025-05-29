import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/utils/urls"

const ContestPage = () => {
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

                <div className="w-full md:px-10 md:pb-10 ">
                    <div className="w-full h-full md:p-20 p-10 flex flex-col items-center justify-center border-4 border-white bg-white rounded-xl ">

                        <div className="w-full flex flex-col md:flex-row justify-evenly gap-6">
                            {/* Left Column */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-pink-400 text-white font-bold py-1 px-4 rounded text-center">공모전 기간</div>
                                <div className="text-gray-800 text-center">
                                    <p>6월 02일(월) 09:00시</p>
                                    <p>~ 7월 04일(금) 18:00시</p>
                                </div>
                                <div className="bg-pink-400 text-white font-bold py-1 px-4 rounded text-center mt-2">참가 자격</div>
                                <div className="text-gray-800 text-sm">
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
                                <div className="bg-pink-400 text-white font-bold py-1 px-4 rounded text-center">결과 발표</div>
                                <div className="text-gray-800 text-center">
                                    <p>7월 30일(수) 09:00시</p>
                                    <p>toonyz.com 홈페이지에서 확인</p>
                                </div>
                                <div className="bg-pink-400 text-white font-bold py-1 px-4 rounded text-center mt-2">상금</div>
                                <div className="flex flex-col items-center mt-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="text-center">
                                            <p className="font-bold">대상 <span>1명</span></p>
                                            
                                        </div>
                                        <div className="bg-pink-200 rounded-lg p-2 text-center">
                                            <p className="font-bold">100만원</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full mt-2">
                                        <div className="inline-flex justify-between w-full">
                                            <p className="font-bold ">
                                               최우수상 <span>2명</span>
                                            </p>
                                         
                                        </div>
                                        <div className="bg-pink-200 rounded-lg p-2 text-center">
                                            <p className="font-bold">각 50만원</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full mt-2">
                                        <div className="text-center">
                                            <p className="font-bold">우수상 <span>4명</span></p>
                                            
                                        </div>
                                        <div className="bg-pink-200 rounded-lg p-2 text-center">
                                            <p className="font-bold">각 30만원</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-col items-center justify-center py-10">
                        <Image
                            src={getImageUrl('toonyz_2025_contest_button.webp')}
                            alt="Contest Applying Button"
                            width={400}
                            height={200}
                            className="cursor-pointer mx-auto"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContestPage