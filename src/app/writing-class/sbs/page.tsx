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
import { Button } from '@/components/shadcnUI/Button';
import FaqSection from '@/components/UI/writingClass/ui/FaqSection';
import Link from 'next/link';
import useMediaQuery from '@mui/material/useMediaQuery';

const file_url_en = `${downloadFiles[4].file_url_en}`;
const file_url_ko = `${downloadFiles[4].file_url_ko}`;

const SBSPage = () => {
  const { language, setLanguageOverride } = useLanguage();
  const { isLoggedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  const handleShareClick = async () => {
    if (isSharing) return; // Prevent multiple simultaneous share attempt
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: "출퇴근 웹소설 연재 생존 전략",
          text: "출퇴근 웹소설 연재 생존 전략 작법서를 공유하세요!",
          url: `/writing-class/sbs`
        });
      } catch (error) {
        console.log('Share failed:', error);
      } finally {
        setIsSharing(false);
      }
    } else {
      setShowShareModal(true);
    }
  }

  const bookImages = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className='flex flex-col min-h-screen !bg-white !dark:bg-white'>
      <WritingClassHeader mode="sbs" />

      <header className='w-full flex flex-col items-center justify-center py-10'

      >
        <div className='flex justify-center items-center'>
          <Image src="/writing-class/images/SBSLogo.png" alt="SBS" width={300} height={120} />
        </div>
        <h1 className='text-4xl font-thin'>X</h1>
        <div className='inline-flex items-center gap-2 md:text-4xl text-lg font-light text-gray-900'>
          <Image src='/writing-class/stelland_star_logo.svg' alt='SBS' width={isMobile ? 20 : 40} height={isMobile ? 20 : 40} />
          <Image src='/writing-class/stelland_logo.svg' alt='SBS' width={isMobile ? 100 : 140} height={isMobile ? 20 : 50} />
          MOU 협약 체결 기념 이벤트
        </div>

        <div className="flex flex-col justify-center items-center gap-4 pt-10 text-gray-900">
          <h1 className='md:text-5xl text-3xl font-bold text-center break-keep '>
            여러분의 성공적인 웹소설 작가 데뷔를 기원합니다
          </h1>

          <p className='font-light text-center pb-10 break-keep text-gray-900' >
            프로페셔널한 웹소설 작가 데뷔를 위한 무료 작법서와 팁들이 준비되어 있습니다. <br />
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
            투니즈에 회원 가입하고 지금 바로 모든 작법서를 다운받으세요.
          </p>
        </div>
      </header >

      {/* mid section */}
      <section className="relative w-full px-4 py-10 ">
        { !isMobile && <div className="flex flex-nowrap justify-center items-center gap-4 z-10">
          {downloadFiles.map((file, index) => (
            <div key={file.id} className='relative z-10 group'>
              <Image
                src={`/writing-class/images/bookcover/book${index + 1}.svg`}
                alt={`book cover ${index + 1}`}
                width={200}
                height={250}
                className='object-cover rounded-sm group-hover:scale-100 transition-transform duration-300 cursor-pointer relative z-10'
              />
              {!isMobile &&
                <div className='absolute inset-0 z-10 bg-black/0 group-hover:bg-white/90 transition-all duration-300 p-2'>
                  <span className='absolute text-center bottom-10 left-0 w-full z-10 text-gray-900 text-xs  font-medium group-hover:opacity-100 opacity-0 transition-all duration-300'>
                    {file.title_ko}
                  </span>
                  <Button
                    variant="ghost"
                    className="absolute bottom-0 left-0 w-full z-10 group-hover:opacity-100 opacity-0 bg-[#DE2B74] hover:bg-pink-300 text-white"
                  >
                    <Link href={`/writing-class/downloads`}>
                      무료로 다운받기
                    </Link>
                  </Button>
                </div>
              }
            </div>
          ))}
        </div>}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
          <Tape />
        </div>
      </section>


      {/* book showcase section */}
      <BookTab isLoggedIn={isLoggedIn ?? false} mode='sbs' />


      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            작법서 독자들의 후기
          </h2>
          <span className='text-sm text-gray-500'>개인정보 보호를 위해 이름은 **으로 표기되었습니다.</span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold text-gray-900">Soj**</h4>
                  <p className="text-sm text-gray-600">투니즈 재미동포 회원</p>
                </div>
              </div>
              <p className="text-gray-700 break-keep">
                한국이 아니라 정보에 제한이 많았는데 작법서가 많은 도움이 되었습니다. 작법서 다 다운받아서 읽었는데 무척 도움이 되었습니다.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold text-gray-900">김**</h4>
                  <p className="text-sm text-gray-600">수성대 웹툰웹소설과</p>
                </div>
              </div>
              <p className="text-gray-700 break-keep">
                스토리텔링 및 구성법이 전략적으로 적혀 있었고 너무 유용했습니다. 스스로 공부하는데 도움이 너무 많이 되었습니다. 감사합니다!
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold text-gray-900">심**</h4>
                  <p className="text-sm text-gray-600">직장인</p>
                </div>
              </div>
              <p className="text-gray-700 break-keep">
                작법서를 읽고나서 직장에 다니면서도 탄탄한 줄거리 흐름은 물론 생생한 캐릭터를 만들어 낼 수 있었어요. 너무 유용한 책이라고 생각합니다. 감사합니다!
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

          <h1 className='text-center text-lg font-base pt-5 text-gray-900'>
            주식회사 스텔라앤은 SBS 아카데미학원과 성공적인 MOU 협력을 기원합니다.
          </h1>

        </div>
      </section>
      <section className="py-12 bg-gradient-to-r from-orange-300 to-sky-400">


        <div className="relative container mx-auto px-4 text-center">
          {/* <Image
            src="/writing-class/images/logo_sticker.svg"
            alt="toonyz logo"
            width={100}
            height={100}
            className="absolute z-[5] top-2 left-1  animate-[spin_9s_linear_infinite] " /> */}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden md:w-[650px] w-full mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h3 className="text-xl font-bold text-gray-900 mb-4">출퇴근 웹소설 연재 생존 전략</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-[#DE2B74]">FREE</span>
                  <span className="ml-2 text-gray-500 line-through strike-through">Amazon $20</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-900">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#DE2B74] mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    1. 캐릭터 설정
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#DE2B74] mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    2. 줄거리 구성
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#DE2B74] mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    3. 마케팅 전략
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#DE2B74] mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    4. OSMU 확장
                  </li>
                </ul>
                <Button size="lg" className="w-full bg-[#DE2B74] hover:text-[#DE2B74] text-white">
                  <Link href='/writing-class/downloads'>
                    무료로 다운받기
                  </Link>
                </Button>
                <p className="text-sm text-gray-500 mt-4 text-center">가입후 무료로 다운 받을 수 있습니다.</p>
              </div>
              <div className="relative">
                <Image
                  src="/writing-class/images/bookcover/coverArt_example.webp"
                  alt="Stelland 작법서 표지"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-white/10" />
                {/* <div className="absolute top-4 right-4 bg-red-600 text-white font-bold py-2 px-4 rounded-full text-lg animate-pulse">
                99%OFF
                </div> */}
              </div>
            </div>
          </div>


          <h2 className="text-3xl font-bold text-white my-8">
            무료로 작법서를 다운받을 수 있도록 공유하세요.
          </h2>
          {/* <CountdownTimer targetDate="2025-06-30" className="text-white" /> */}
          <p className="text-xl mb-8 text-white max-w-2xl mx-auto whitespace-pre-line break-keep">
            스텔라앤 작법서 컨텐츠는 MOU 이벤트 기간 동안 무료로 다운받을 수 있습니다. <br />
            지금 바로 다운받고 성공적인 웹소설 작가로 성장하세요.
          </p>

          <Button
            variant="outline"
            className="bg-white text-black rounded-full text-xl px-12 py-6"
            onClick={handleShareClick}
          >
            공유하기
          </Button>

        </div>
      </section>



      <section className="container mx-auto px-4 py-16 md:py-24">
        <FaqSection mode='sbs' />
      </section>

    </div >
  )
}

export default SBSPage;