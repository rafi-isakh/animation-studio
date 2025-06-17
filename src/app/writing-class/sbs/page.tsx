'use client'
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Tape from '@/components/UI/writingClass/sbs/Tape';
import BookShelf from '@/components/UI/writingClass/ui/BookShelf';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import PDFviewButton from '@/components/UI/writingClass/ui/PDFviewButton';
import { downloadFiles } from "../data/downloadFiles";
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/providers';
import { BookTab } from '@/components/UI/writingClass/ui/BookTab';
import WritingClassHeader from "@/components/UI/writingClass/ui/WritingClassHeader"
import { Language } from '@/components/Types';
import CountdownTimer from "@/components/UI/writingClass/ui/CountDownTimer";
import { Button } from '@/components/shadcnUI/Button';

const file_url_en = `${downloadFiles[4].file_url_en}`;
const file_url_ko = `${downloadFiles[4].file_url_ko}`;

const SBSPage = () => {
  const { language, setLanguageOverride } = useLanguage();
  const { isLoggedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const previousTheme = theme;
    if (previousTheme === "dark") {
      toggleTheme("light");
    }
  }, [theme]);

  useEffect(() => {
    if (language === "en") {
      setLanguageOverride("ko" as Language);
    }
  }, [language]);


  const bookImages = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className='flex flex-col min-h-screen !bg-white !dark:bg-white'>
      <WritingClassHeader />

      <header className='w-full flex flex-col items-center justify-center py-10'

      >
        <div className='flex justify-center items-center'>
          <Image src="/writing-class/images/SBSLogo.png" alt="SBS" width={200} height={30} />
        </div>
        <h1 className='text-4xl font-thin'>X</h1>
        <div className='inline-flex items-center gap-2 md:text-2xl text-xl font-light'>

          {/* Stella& Inc.  */}

          <Image src='/writing-class/stelland_star_logo.svg' alt='SBS' width={20} height={20} />
          <Image src='/writing-class/stelland_logo.svg' alt='SBS' width={100} height={20} />

          MOU 협약 체결 기념 이벤트
        </div>

        <div className="flex flex-col justify-center items-center gap-4 pt-10">
          <h1 className='md:text-5xl text-3xl font-bold text-center break-keep'>
            여러분의 성공적인 웹소설 작가 데뷔를 기원합니다
          </h1>

          <p className='font-light text-center pb-10 break-keep' >
            프로페셔널한 웹소설 작가 데뷔를 위한 무료 작법서와 팁들이 준비 되었습니다. <br />
            스텔라앤과 함께 글쓰기 실력을 키워보세요.
          </p>
          <PDFviewButton
            mode="page"
            language={language}
            title={language === "en" ? "View Free Book" : "무료로 작법서 보기"}
            file_url_en={file_url_en}
            file_url_ko={file_url_ko}
            isLoggedIn={isLoggedIn === null ? undefined : isLoggedIn}
          />
          <p className="w-fit text-sm text-gray-500 md:mx-0 mx-auto">
            투니즈에 회원 가입하고 지금 바로 모든 작법서를 다운 받으세요.
          </p>
        </div>
      </header >

      {/* mid section */}
      <section className="relative w-full px-4 py-10 ">
        <div className="flex flex-nowrap justify-center items-center gap-4">
          {bookImages.map(i => (
            <Image
              key={i}
              src={`/writing-class/images/bookcover/book${i}.svg`}
              alt={`book cover ${i}`}
              width={200}
              height={250}
              className='object-cover rounded-sm'
            />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <Tape />
        </div>
      </section>


      {/* book showcase section */}
      <BookTab isLoggedIn={isLoggedIn ?? false} />


      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {language === "en" ? "What Our Writers Say"
              : "수강생들의 이야기"}
          </h2>
          <span className='text-sm text-gray-500'>개인정보 보호를 위해 이름은 **으로 표기되었습니다.</span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold">박**</h4>
                  <p className="text-sm text-gray-600">중부대학교 만화애니메이션학과</p>
                </div>
              </div>
              <p className="text-gray-700">
                작법서를 읽기 전에는 첫번째 장을 쓰기까지 너무 어려웠는데 작법서를 읽고 나서는 첫번째 장을 쓰는데 큰 도움이 되었습니다.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold">김**</h4>
                  <p className="text-sm text-gray-600">수성대 웹툰웹소설과</p>
                </div>
              </div>
              <p className="text-gray-700">
                스토리텔링 및 구성법이 전략적으로 적혀 있었고 너무 유용했습니다. 스스로 공부하는데 도움이 너무 많이 되었습니다. 감사합니다!
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold">이**</h4>
                  <p className="text-sm text-gray-600">수성대 웹툰웹소설과</p>
                </div>
              </div>
              <p className="text-gray-700">
                작법서를 읽고나서 탄탄한 줄거리 흐름은 물론 생생한 캐릭터를 만들어 낼 수 있었어요. 너무 유용한 책이라고 생각합니다. 감사합니다!
              </p>
            </div>
          </div>
        </div>
      </section>


      <section className='w-full py-20 flex justify-center items-center'>
        <div className='container mx-auto px-4'>
          <div className='relative w-full flex items-center justify-center gap-4'>
            <Image src='/writing-class/sbs_ios_logo.svg' alt='SBS Academy logo' width={100} height={100} className='relative -right-5 rounded-3xl rotate-12 hover:rotate-45 transition-transform duration-300 shadow-md' />
            <Image src='/writing-class/stella_ios_logo.svg' alt='stelland logo' width={100} height={100} className='rounded-3xl -rotate-12 hover:-rotate-45 transition-transform duration-300 shadow-md' />
          </div>

          <h1 className='text-center text-lg font-base pt-5'>
            주식회사 스텔라앤은 SBS 아카데미학원과 성공적인 산학협력을 기원합니다.
          </h1>

          <p>

          </p>
        </div>
      </section>
      <section className="py-12 bg-gradient-to-r from-orange-300 to-sky-400">
        <div className="relative container mx-auto px-4 text-center">
          
          <h2 className="text-3xl font-bold text-white mb-8">
           무료로 작법서를 다운받을 수 있도록 공유하세요.
          </h2>
          <CountdownTimer targetDate="2025-06-30" className="text-white" />
          <p className="text-xl mb-8 text-white max-w-2xl mx-auto whitespace-pre-line break-keep">
            스텔라앤 작법서 컨텐츠는 MOU 이벤트 기간 동안 무료로 다운 받을 수 있습니다.
            지금 바로 다운받고 성공적인 웹소설 작가로 성장하세요.
          </p>

          <Button variant="outline" className="bg-white text-black rounded-full text-xl px-12 py-6">
            공유하기
          </Button>

        </div>
      </section>

    </div >
  )
}

export default SBSPage;