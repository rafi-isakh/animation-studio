'use client'
import { useEffect, useState } from 'react'
import Link from "next/link"
import Image from 'next/image'
import { Button } from "@mui/material"
import OtherTranslateComponent from '@/components/OtherTranslateComponent'
import { useLanguage } from '@/contexts/LanguageContext'
// import { useTheme } from '@mui/material/styles';
import { useTheme } from '@/contexts/providers'


export default function Studio() {

    const { theme } = useTheme()
    // const theme = useTheme()

    // const [logoWidth, setLogoWidth] = useState(141);
    // const [logoHeight, setLogoHeight] = useState(32);
    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(1000);
    const [key3, setKey3] = useState(2000);
    const [key4, setKey4] = useState(3000);
    const [key5, setKey5] = useState(4000);
    const [key6, setKey6] = useState(5000);
    const [key7, setKey7] = useState(6000);
    const { language } = useLanguage();

    useEffect(() => {
        setKey1(prevKey => prevKey + 1);
        setKey2(prevKey => prevKey + 1);
        setKey3(prevKey => prevKey + 1);
        setKey4(prevKey => prevKey + 1);
        setKey5(prevKey => prevKey + 1);
        setKey6(prevKey => prevKey + 1);
        setKey7(prevKey => prevKey + 1);
    }, [language]);

    return (
        <div className="flex flex-col items-center justify-center h-full px-4">

            <div className='sm:block md:hidden lg:hidden md:py-8 lg:py-8 '></div>
            {/* Top Part */}
            {/* <p className="text-[2rem] flex flex-row ">
                <Image
                    src="/N_Logo.png"
                    alt="Toonyz Logo"
                    width={0}
                    height={0}
                    sizes="100vh"
                    style={{ height: '35px', width: '35px', justifyContent: 'center', alignSelf: 'center' }}
                />
                <span className='ml-4 font-bold text-[#DB2777]'>Studio</span>
            </p>
            <p >Your Favorite Story Universe, Between Us, Toonyz</p>
            <p className="mb-10">Toonyz의 스마트한 AI로 여러분의 스토리텔링이 현실이 되는 즐거움을 경험 해 보세요. </p>
 */}

                {/* Image Studio part  */}



                    <div className='flex flex-col md:flex-row lg:flex-row gap-10'>

                        <div className="flex flex-col">

                            <div className="logo flex flex-row gap-4 mt-10">
                                <Image
                                    src={theme === 'dark' ? '/toonyz_logo_white.svg' : '/toonyzLogo.png'} 
                                    // src="/toonyzLogo.png"
                                    alt="Toonyz Logo"
                                    width={0}
                                    height={0}
                                    sizes="100vh"
                                    style={{ height: '24px', width: '106px', justifyContent: 'center', alignSelf: 'center' }}
                                />
                                <Link
                                    href="/studio/pictures"
                                    className='text-[2rem]'
                                >
                                    <div className="w-[200px]">
                                        <OtherTranslateComponent
                                            key={key1}
                                            content="이미지 스튜디오"
                                            elementId={"1"}
                                            elementType='other'
                                            elementSubtype="other"
                                            showLoading={false}
                                            classParams="text-2xl"
                                            defaultLanguage='ko'
                                        />
                                    </div>
                                </Link>
                            </div>

                            <div className="w-[330px]">
                                <OtherTranslateComponent
                                    key={key2}
                                    content={`여러분의 아이디어가 실현이 되는 웹툰 이미지를 만들어 보세요. 이미지 스튜디오 AI는 여러분의 이야기를 그림으로 표현할 수 있도록 도와줍니다. 아이디어만 있으면 키워드로 이미지를 만들 수 있고, 언제 어디서나 이미지를 다운로드 받을 수 있습니다.`}
                                    elementId={"1"}
                                    elementType='other'
                                    elementSubtype="other"
                                    showLoading={false}
                                    classParams="my-10"
                                    defaultLanguage='ko'
                                />
                            </div>

                            <Link href='/studio/pictures'>
                            <Button
                                 sx={{
                                    borderColor: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#374151',
                                    '&:hover': {
                                        borderColor: '#db2777' // [#DB2777] equivalent
                                    },
                                    border: '1px solid'
                                }}
                                variant="contained"
                                color="gray"
                                className='w-full border border-gray-700 dark:border-white rounded-md px-10 py-3 
                                        hover:border-[#DB2777] hover:text-[#DB2777] 
                                        dark:hover:border-[#DB2777] dark:hover:text-[#DB2777]
                                        dark:text-white'>
                                <OtherTranslateComponent
                                    key={key3}
                                    content="이미지 생성"
                                    elementId={"2"}
                                    elementType='other'
                                    elementSubtype="other"
                                    showLoading={false}
                                    classParams="text-lg"
                                    defaultLanguage='ko'
                                />
                            </Button>
                            </Link>

                        </div>

                        <div className='image'>
                            <Image
                                src="/studio_image.png"
                                alt="Toonyz Web Novel Studio"
                                width={550}
                                height={550}
                            />
                        </div>

                    </div>
                    <div className="flex flex-col">

                        <div className='flex flex-col md:flex-row lg:flex-row gap-10'>

                            <Image
                                src="/studio_webnovel.png"
                                alt="Toonyz Web Novel Studio"
                                width={550}
                                height={550}
                                className='self-center'
                            />
                            <div className='description mt-10'>
                                <div className="logo flex flex-row gap-4">
                                    <Image
                                        src={theme === 'dark' ? '/toonyz_logo_white.svg' : '/toonyzLogo.png'} 
                                        // src="/toonyzLogo.png"
                                        alt="Toonyz Logo"
                                        width={0}
                                        height={0}
                                        sizes="100vh"
                                        style={{ height: '24px', width: '106px', justifyContent: 'center', alignSelf: 'center' }}

                                    />

                                    <Link
                                        href="/studio/novel"
                                        className='text-[2rem]'
                                    >
                                        <OtherTranslateComponent
                                            key={key4}
                                            content="웹툰 스튜디오"
                                            elementId={"4"}
                                            elementType='other'
                                            elementSubtype="other"
                                            showLoading={false}
                                            classParams="text-2xl"
                                            defaultLanguage='ko'
                                        />
                                        {/* <small className='text-[10px] self-end'>BETA</small> */}

                                        {/* <svg className="cs4ft cjvbc cb0iz c3cwy cqn82 cmzpz" width="220" height="24" viewBox="0 0 220 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M134.66 13.107c-10.334-.37-20.721-.5-31.12-.291l-2.6.06c-4.116.04-8.193.602-12.3.749-14.502.43-29.029 1.196-43.514 2.465-6.414.63-12.808 1.629-19.04 2.866-7.93 1.579-16.113 3.71-23.367 5.003-2.211.374-3.397-1.832-2.31-4.906.5-1.467 1.838-3.456 3.418-4.813a16.047 16.047 0 0 1 6.107-3.365c16.88-4.266 33.763-6.67 51.009-7.389C71.25 3.187 81.81 1.6 92.309.966c11.53-.65 23.097-.938 34.66-.96 7.117-.054 14.25.254 21.36.318l16.194.803 4.62.39c3.85.32 7.693.618 11.53.813 8.346.883 16.673.802 25.144 2.159 1.864.276 3.714.338 5.566.873l.717.225c6.162 1.977 7.92 3.64 7.9 7.197l-.003.203c-.017.875.05 1.772-.112 2.593-.581 2.762-4.066 4.12-8.637 3.63-13.696-1.06-27.935-3.332-42.97-4.168-11.055-.83-22.314-1.459-33.596-1.603l-.022-.332Z" fill="#D1D5DB" fill-rule="evenodd"></path>
                            </svg> */}

                                    </Link>
                                </div>


                                <div className="w-[330px]">
                                    <OtherTranslateComponent
                                        key={key5}
                                        content={`스토리를 중심으로 원스톱 스토리보드 생성을 지원합니다. 스토리텔링 AI 기술을 활용한 스마트 툴로 누구나 쉽게 이야기를 만들 수 있는 웹툰 기획 스튜디오입니다. 새로운 이야기를 발굴하고 여러분의 아이디어를 완성해보세요!`}
                                        elementId={"5"}
                                        elementType='other'
                                        elementSubtype="other"
                                        showLoading={false}
                                        classParams="my-10"
                                        defaultLanguage='ko'
                                    />
                                </div>

                                <Link href="/studio/novel">
                                <Button
                                     sx={{
                                        borderColor: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#374151',
                                        '&:hover': {
                                            borderColor: '#db2777' // [#DB2777] equivalent
                                        },
                                        border: '1px solid'
                                    }}
                                    variant="contained"
                                    color="gray"
                                    className='w-full border border-gray-700 dark:border-white rounded-md px-10 py-3 
                                        hover:border-[#DB2777] hover:text-[#DB2777] 
                                        dark:hover:border-[#DB2777] dark:hover:text-[#DB2777]
                                        dark:text-white'>
                                    <OtherTranslateComponent
                                        key={key6}
                                        content="시작하기"
                                        elementId={"6"}
                                        elementType='other'
                                        elementSubtype="other"
                                        showLoading={false}
                                        classParams="text-lg"
                                        defaultLanguage='ko'
                                    />
                                </Button>
                                </Link>

                            </div>


                        </div>

                    </div>

            </div>
    );
}