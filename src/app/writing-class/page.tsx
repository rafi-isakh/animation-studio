'use client';
import Image from "next/image";
import Link from "next/link";
import { Check, Globe, ChevronRight, Instagram, Youtube, Linkedin, Twitter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcnUI/Popover"
import { Language } from "@/components/Types";
import { Button } from "@/components/shadcnUI/Button";
import { BookCard } from "@/components/UI/writingClass/ui/BookCard";
import { useLanguage } from "@/contexts/LanguageContext";
import BookShelf from "@/components/UI/writingClass/ui/BookShelf";
import FaqSection from "@/components/UI/writingClass/ui/FaqSection";
import { BookListCarousel } from "@/components/UI/writingClass/ui/BookListCarousel";
import LearningSection from "@/components/UI/writingClass/ui/LearningSection";
import { BookTab } from "@/components/UI/writingClass/ui/BookTab";
import RoundedButton from "@/components/UI/writingClass/RoundedButton/RoundedButton";
import CountdownTimer from "@/components/UI/writingClass/ui/CountDownTimer";
import Header from "@/components/UI/writingClass/ui/WritingClassHeader";
import { DrawCircleText } from "@/components/UI/writingClass/ui/DrawCircleText";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/providers";
import { useEffect } from "react";

export default function WritingClassPage() {
  const { isLoggedIn } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language);
    console.log("Language changed to", newLanguage);
 }

 useEffect(() => {
  const previousTheme = theme;
  if (previousTheme === "dark") {
    toggleTheme("light");
  }
 }, [theme]);


  return (
    <div className="flex flex-col min-h-screen !bg-white !dark:bg-white ">
      {/* Top Navigation Bar */}
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0 order-2 md:order-1">
          <p className="text-red-500 font-bold text-2xl md:text-3xl mb-2">99% OFF</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {language === "en" ? <><span className="">Webnovel Writing Debut</span>, <br /> No longer a dream</>
              : <><span className="">웹소설 작가 데뷔</span>, <br /> 더 이상 꿈이 아닙니다</>}
          </h1>
          <p className="text-gray-600 mb-8 max-w-lg">
            {language === "en" ? <><span className="">For webnovel writing beginners</span>, <br /> we have prepared free e-books and tips.</>
                               : <>웹소설 입문자를 위한 무료 작법서와 팁들이 준비 되었습니다. <br /> 투니즈와 함께 글쓰기 실력을 키워보세요.</>}
          </p>
          <RoundedButton className='w-[330px] md:mx-0 mx-auto dark:text-black'>
            {isLoggedIn ? <Link href="#">
              {language === "en" ? "Join Free Writing Class" : "지금 작법서 무료로 받기"}
            </Link> : <Link href="/signin">
              {language === "en" ? "Join Free Writing Class" : "가입하고 무료로 작법서 받기"}
            </Link>}
          </RoundedButton>
        </div>

        <div className="md:w-1/2 relative md:order-2 order-1">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-4">
              <BookCard
                title={language === "en" ? "1. Webnovel Writing" : "1. 웹소설의 세계로"}
                author={language === "en" ? "Become a Digital Storyteller" : "디지털 시대의 이야기꾼 되기"}
                color="bg-blue-100"
                imageUrl="/writing-class/images/bookcover/book1.svg"
              />
              <BookCard
                title={language === "en" ? "4. Create Vivid Characters" : "4. 생생한 캐릭터 창조하기"}
                author={language === "en" ? "Create Characters" : "독자의 마음을 훔치는 인물 만들기"}
                color="bg-green-100"
                imageUrl="/writing-class/images/bookcover/book4.svg"
              />
            </div>
            <div className="col-span-1 space-y-4 mt-8">
              <BookCard
                title={language === "en" ? "2. Create Your Own Story" : "2. 나만의 이야기 씨앗 심기"}
                author={language === "en" ? "Discover and Develop Creative Ideas" : "창의적 아이디어 발굴과 개발"}
                color="bg-yellow-200"
                imageUrl="/writing-class/images/bookcover/book2.svg"
              />
              <BookCard
                title={language === "en" ? "5. The Secret of First Sentence" : "5. 첫 문장에서 마지막 문장까지"}
                author={language === "en" ? "Writing Techniques" : "강렬한 도입부 작성의 기술"}
                color="bg-orange-200"
                imageUrl="/writing-class/images/bookcover/book5.svg"
              />
            </div>
            <div className="col-span-1 space-y-4 mt-16">
              <BookCard
                title={language === "en" ? "3. Storytelling Techniques" : "3. 독자를 이끄는 스토리텔링 기술"}
                author={language === "en" ? "Break the Clichés" : "클리셰를 깨부순 글쓰기 노하우"}
                color="bg-purple-200"
                imageUrl="/writing-class/images/bookcover/book3.svg"
              />
              <BookCard
                title={language === "en" ? "6. Editing and Revising" : "6. 완성도를 높이는 수정과 편집"}
                author={language === "en" ? "Revising Effectively" : "효과적인 수정과 편집 방법"}
                color="bg-pink-200"
                imageUrl="/writing-class/images/bookcover/book6.svg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Header Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative flex md:flex-row flex-col items-center justify-center gap-4">
            <h3 className="md:relative md:left-10 text-2xl md:text-4xl font-bold text-center mb-8 md:order-1 order-2">
              <span className="text-gray-500 z-10">
                {language === "en" ? "Helping you become a webnovel writer"
                  : "웹소설 작가로 데뷔를 도와주는"}
              </span> <br />
              <span className="text-black z-10">
                {language === "en" ? "TOONYZ Writing 101 Class OPEN"
                                    : "투니즈 글쓰기 101 작법서 출간 OPEN"}
              </span>
            </h3>
            <Image
              src="/writing-class/images/circular_text.svg"
              alt="Toonyz Logo"
              width={100}
              height={100}
              className="relative md:bottom-10 z-[5] animate-[spin_9s_linear_infinite] md:order-2 order-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 mb-12">
            {/* Element 1 */}
            <div className="flex flex-col items-center text-center p-6 border-none rounded-lg ">
              <div className="text-[#DE2B74] mb-4">
                <h3 className="text-4xl font-extrabold">✍️ 100+</h3>
              </div>
              <h3 className="text-xl font-bold mb-2  whitespace-pre-line break-keep">
                {language === "en" ? "Practical writing tips" : "실전 중심의 글쓰기 노하우를 담은 팁들"}
              </h3>
            </div>

            {/* Element 2 */}
            <div className="flex flex-col items-center text-center p-6 border-none rounded-lg ">
              <div className="text-[#DE2B74] mb-4">
                <h3 className="text-4xl font-extrabold">📚 7+</h3>
              </div>
              <h3 className="text-xl font-bold mb-2  whitespace-pre-line break-keep">
                {language === "en" ? "Customizable content that can be learned anytime, anywhere"
                  : "언제 어디서든 학습 가능한 맞춤형 콘텐츠인 무료 PDF 자료 제공"}
              </h3>
            </div>

            {/* Element 3 */}
            <div className="flex flex-col items-center text-center p-6 border-none rounded-lg ">
              <div className="text-[#DE2B74] mb-4">
                <h3 className="text-4xl font-extrabold">💡10+</h3>
              </div>
              <h3 className="text-xl font-bold mb-2 whitespace-pre-line break-keep">
                {language === "en" ? "Actual webnovel writer's story planning and publishing tips"
                  : <>실제 현업 작가들의 스토리 기획부터 연재 팁들</>}
              </h3>
            </div>
          </div>

          <div className="text-center mb-12">
            <p className="text-lg mb-4 whitespace-pre-line break-keep">
              {language === "en" ? "Join the Toonyz Writing 101 class now to get the full guide to creating a high-quality webnovel."
                                 : "완성도 높은 작품을 위한 전 과정 안내를 해 드리는 투니즈 글쓰기 101 지금 바로 가입하고 무료로 다운 받으세요!"}
            </p>
          </div>
        </div>
      </section>


      {/* Categories Section */}
      <section className="w-full mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {language === "en" ? "TOP Writing Guide Class" : "TOP 작법서 클래스"}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto whitespace-pre-line break-keep">
            {language === "en" ? "Introducing the best writing guide class that has received the most love." : "가장 많은 사랑을 받은 베스트 작법서 클래스를 소개합니다."}
          </p>
        </div>
        <BookListCarousel />

         <DrawCircleText />
      
      </section>
      {/* mid section */}
      <section className="container mx-auto px-4 py-16 ">
        <div className="md:max-w-7xl w-full mx-auto">
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-3xl font-bold text-[#1d1d1f]">
                {language === "en" ? "Toonyz Writing Guide Series" : "투니즈 작법서 시리즈"}
              </h2>
              <Link href="#">
                <Button variant="link" className="flex flex-row items-center text-gray-500 hover:underline cursor-pointer">
                  {language === "en" ? "See All" : "더보기"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <BookShelf />
          </section>
        </div>
      </section>

      {/* Program Details Section */}
      <section className="py-16 bg-gray-100">
        <h2 className="text-3xl font-bold text-center">
          {language === "en" ? "4 Weeks, 7 e-books, 1 Completed Story That You Can Start"
                              : "4주 완성 7개의 작법서 - 바로 작품 1개를 완성할 수 있는 노하우를 담았습니다"}
        </h2>
        <LearningSection />
      </section>

      {/* book showcase section */}
      <BookTab />

      {/* CTA Section */}
      <section className="py-16 bg-zinc-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <Image
            src="/writing-class/images/certification.svg"
            alt="webnovel class certification image"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h2 className="text-xl md:text-4xl font-bold mb-6">
            {language === "en" ? "Webnovel Writing is now possible with Toonyz Writing Class"
                               : "웹소설 작가 데뷔는 투니즈 글쓰기 101로 가능합니다 "}
          </h2>
          <p className="md:text-xl text-sm mb-8 mx-auto">
            {language === "en" ? "One day 10 minutes, one month 200, a webnovel writer/e-book PDF side hustle, it's no longer a dream!"
                               : "하루 10분 일하고 월 200 꾸준히 버는 웹소설 작가/전자책 PDF 부업, 이제 꿈이 아닙니다!"}
          </p>
          <p className="md:text-xl text-sm mx-auto">
            {language === "en" ? "Once you finish the Toonyz Writing Class,"
                               : "투니즈 글쓰기 101 참고서를 읽고나면,"}
          </p>


          <div className="max-w-screen-md mx-auto md:p-10 p-4">
            <hr className="border border-gray-300 mb-8" />
            <ul className="md:text-xl text-sm grid grid-cols-1 gap-4 text-black text-left">
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "7 books with a systematic synopsis creation strategy"
                  : "체계적으로 완성된 시놉시스 만들기 노하우를 담은 책 7권"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Exclusive opportunity to create Toonyz original IP* (depends on completion)"
                  : "투니즈 오리지널 IP 독점 기회 제공* (완성도에 따라 다름)"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Master webnovel/e-book lecture for life"
                  : "마스터 웹소설/전자책 강의 평생 무료 제공"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Complete webnovel writer's debut roadmap"
                  : "웹소설 작가의 데뷔 완벽 로드맵 제공"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Official Toonyz Writing Class completion certificate issued"
                  : "공식 투니즈 클래스 수강 완료 취득서 발급"}</p>
                <p>✅</p>
              </li>
            </ul>
          </div>

          <div className="py-16">
            <RoundedButton className='w-[330px] mx-auto'>
              <Link href="#">
                {language === "en" ? "Download Free e-book"
                  : "무료 작법서 다운로드 받기"}
              </Link>
            </RoundedButton>
            <p className="mt-4 text-sm">
              {language === "en" ? "Easy login to download"
                : "간편 로그인으로 바로 다운로드 가능해요"}
            </p>
          </div>
        </div>
      </section>

      <section className="container max-w-screen-md mx-auto md:p-10 p-0">
        <div className="bg-white p-8 rounded-lg ">
          <h3 className="text-2xl font-bold mb-8 text-center">
            {language === "en" ? "Benefits for participants" : "참가자 혜택"}
          </h3>
          <ul className="space-y-4 md:text-xl text-sm">
            <li className="flex items-start">
              <Check className="h-6 w-6 bg-[#DE2B74] text-white rounded-full p-1 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                {language === "en" ? "K-Webnovel Structure Template Pack (PDF)"
                                   : "K-웹소설 구조 템플릿 풀 패키지 (PDF)"}
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-6 w-6 bg-[#DE2B74] text-white rounded-full p-1 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                {language === "en" ? "Exclusive Story Hook Guide"
                                   : "독자를 끌어당기는 웹소설 훅 비법 가이드"}
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-6 w-6 bg-[#DE2B74] text-white rounded-full p-1 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                {language === "en" ? "Access to private writing Discord group"
                                   : "웹소설 작가 프라이빗 모임 온/오프라인 기회 제공"}
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-6 w-6 bg-[#DE2B74] text-white rounded-full p-1 mr-2 flex-shrink-0 mt-0.5" />
              <span>{language === "en" ? "Feedback from professional editors"
                                       : "현업 작가들에게 1:1 피드백 기회 제공"}</span>
            </li>
          </ul>

          <div className="mt-8 pt-8 border-t">
            <ul className="grid grid-cols-1 gap-4">
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p className="font-bold md:text-2xl text-xl">{language === "en" ? "Time" : "일정"}</p>
                <p className="text-right md:text-md text-sm">
                  2025년 5월 7일 (예정) <br />
                  모집기간: 4월 18일 ~ 5월 6일 까지
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p className="font-bold md:text-2xl text-xl">{language === "en" ? "Duration" : "시간"}</p>
                <p className="text-right md:text-md text-sm">
                  4주 (주 2회 실시간 Zoom 세션) <br />
                  00:00 AM - 00:00 PM
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p className="font-bold md:text-2xl text-xl">{language === "en" ? "Price" : "가격"}</p>
                <p className="text-right md:text-md text-sm">
                  얼리버드 $199/선착순 10명 <br />
                  최종 가격 $299
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p className="font-bold md:text-2xl text-xl">{language === "en" ? "Participants" : "인원"}</p>
                <p className="text-right md:text-md text-sm">20명</p>
              </li>
            </ul>
          </div>
        </div>
        <RoundedButton backgroundColor="#000000" className="w-[330px] mx-auto ">
          <Link href="#">
            {language === "en" ? "Reserve Your Spot Now" : "지금 바로 예약하기"}
          </Link>
        </RoundedButton>
        <p className="text-center text-sm text-[#DE2B74] mt-3">
          {language === "en" ? "Only 20 writers will be accepted."
                             : "최대 20명의 예비 작가만 수용합니다."}
          <span className="text-black">*</span>
        </p>
      </section>



      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {language === "en" ? "What Our Writers Say" 
                               : "수강생 작가들의 이야기"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold">Sarah J.</h4>
                  <p className="text-sm text-gray-600">Romance Writer</p>
                </div>
              </div>
              <p className="text-gray-700">
                Before Toonyz, I struggled to get readers past my first chapter. Now my retention rate is over 85% and
                I&apos;ve built a loyal following!
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold">Michael T.</h4>
                  <p className="text-sm text-gray-600">Fantasy Author</p>
                </div>
              </div>
              <p className="text-gray-700">
                The structured approach to episodic storytelling completely changed how I write. My latest series has
                over 500,000 reads on Wattpad!
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-bold">Jessica L.</h4>
                  <p className="text-sm text-gray-600">Sci-Fi Writer</p>
                </div>
              </div>
              <p className="text-gray-700">
                The feedback from professional editors was invaluable. I&apos;ve now signed a contract with a publisher who
                discovered my work on Webnovel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-[#DE2B74]">
        <div className="relative container mx-auto px-4 text-center">
          <Image 
          src="/writing-class/images/logo_sticker.svg" 
          alt="toonyz logo" 
          width={100} 
          height={100} 
          className="absolute -top-20 md:left-1/3 md:transform md:-translate-x-1/2 z-[5] animate-[spin_9s_linear_infinite]" />
          <h2 className="text-3xl font-bold text-white mb-8">
            {language === "en" ? "Limited Spots Available!"
              : "얼마 남지 않은 기회입니다!"}
          </h2>
          <CountdownTimer targetDate="2025-05-06" className="text-white" />
          <p className="text-xl mb-8 text-white max-w-2xl mx-auto whitespace-pre-line break-keep">
            {language === "en" ? <>Those books are free now, but they will be converted to paid content soon.<br /></>
              : <>이 작법서는 현재 무료이지만 유료 컨텐츠로 전환될 예정입니다 <br /></>}
            {language === "en" ? "Download them today and start your journey to becoming a successful web novel writer."
                               : "지금 바로 다운받고 성공적인 웹소설 작가로 시작하세요."}
          </p>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <FaqSection />
      </section>

      {/* Footer */}
      <footer className=" bg-zinc-900 text-white py-8">
        <div className="md:max-w-screen-lg w-full mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold mb-4">{language === "en" ? "Site map" : "사이트 맵"}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="https://stelland.io" target="_blank" className="text-sm text-gray-400 hover:text-white">
                    {language === "en" ? "Company" : "회사 소개"}
                  </Link>
                </li>
                <li>
                  <Link href="https://toonyz.com" target="_blank" className="text-sm text-gray-400 hover:text-white">
                    {language === "en" ? "Go to Toonyz" : "투니즈 바로가기"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">{language === "en" ? "Contact" : "고객 지원"}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white">
                    hello@stelland.io
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white">
                    {language === "en" ? "Terms of Service" : "이용 약관"}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white">
                    {language === "en" ? "Help Center" : "문의 하기"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              {/* <h3 className="text-lg font-bold mb-4">Resources</h3> */}
              <ul className="flex flex-row gap-2 justify-end">
                <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                  <Link href="#" target="_blank" className="text-sm text-gray-400 hover:text-white">
                    <Twitter className="w-4 h-4" />
                  </Link>
                </li>
                <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                  <Link href="#" target="_blank" className="text-sm text-gray-400 hover:text-white">
                    <Instagram className="w-4 h-4" />
                  </Link>
                </li>
                <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                  <Link href="#" target="_blank" className="text-sm text-gray-400 hover:text-white">
                    <Linkedin className="w-4 h-4" />
                  </Link>
                </li>
                <li className="bg-gray-800 rounded-full p-2 px-2 inline-flex items-center justify-center ">
                  <Link href="#" className="text-sm text-gray-400 hover:text-white">
                    <Youtube className="w-4 h-4" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-left">
            <div className="flex flex-row justify-between items-center">
              <p className="text-sm text-gray-400 text-center">
                &copy; {new Date().getFullYear()} Stella&. All rights reserved.
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="inline-flex items-center justify-center text-sm text-gray-400 text-center cursor-pointer">
                    <Globe className="w-4 h-4" />
                    {language === "en" ? "Language" : "언어"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit border border-gray-800 rounded-md bg-gray-900">
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => handleLanguageChange("en")} variant="ghost" className="text-sm text-gray-400 hover:text-white cursor-pointer">
                      English
                    </Button>
                    <Button onClick={() => handleLanguageChange("ko")} variant="ghost" className="text-sm text-gray-400 hover:text-white cursor-pointer">
                      한국어
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
