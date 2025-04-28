'use client';
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Info } from "lucide-react";
import { Dialog } from "@/components/shadcnUI/Dialog"
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
import { DrawCircleText } from "@/components/UI/writingClass/ui/DrawCircleText";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/providers";
import { useEffect, useState } from "react";
import { LoginDialog } from "@/components/UI/writingClass/ui/WritingClassHeader";
import { useToast } from "@/hooks/use-toast";
import { downloadFiles } from "./downloads/page";

export default function WritingClassPage() {
  const { isLoggedIn } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  // const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const previousTheme = theme;
    if (previousTheme === "dark") {
      toggleTheme("light");
    }
  }, [theme]);

  const downloadFile = (fileName: string) => {
    if (!fileName || fileName.trim() === '') {
      toast({
        title: "Error downloading file",
        description: "File key is missing",
        variant: "destructive",
      });
      console.error('File key is missing');
      return;
    }

    fetch(`/api/download?file=${encodeURIComponent(fileName)}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Authentication error",
              description: "You need to be signed in to download files",
              variant: "destructive",
            });
            return Promise.reject(new Error("Authentication error"));
          }
          return response.json().then(data => {
            throw new Error(data.error || `HTTP error! Status: ${response.status}`);
          }).catch(() => {
            throw new Error(`HTTP error! Status: ${response.status}`);
          });
        }

        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator?.userAgent || '');

        if (isSafariBrowser) {
          // For Safari, we need to handle downloads differently
          return response.blob().then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName.split('/').pop() || 'download.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
              title: "File download started",
              description: fileName.split('/').pop() || fileName,
              variant: "success",
            });
          });
        }

        // For non-Safari browsers
        window.open(response.url, '_blank');
        toast({
          title: "File download started",
          description: fileName.split('/').pop() || fileName,
          variant: "success",
        });
      })
      .catch(error => {
        if (!(error instanceof Error && error.message.startsWith('HTTP error'))) {
          toast({
            title: "Error preparing download",
            description: error.message || "Could not get download link.",
            variant: "destructive",
          });
        }
        console.error('Error downloading file:', error);
      });
  }

  return (
    <div className="flex flex-col min-h-screen !bg-white !dark:bg-white ">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0 order-1 md:order-1">
          <p className="text-red-500 font-bold text-2xl md:text-3xl mb-2">{language === "en" ? "1 Chapter Free" : "1강 무료"}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {language === "en" ? <><span className="">Webnovel Writing Debut</span>, <br /> No longer a dream</>
              : <><span className="">웹소설 작가 데뷔</span>, <br /> 더 이상 꿈이 아닙니다</>}
          </h1>
          <p className="text-gray-600 mb-8 max-w-lg">
            {language === "en" ? <><span className="">For webnovel writing beginners</span>, <br /> we have prepared free e-books and tips.</>
              : <>웹소설 입문자를 위한 무료 작법서와 팁들이 준비 되었습니다. <br /> 투니즈와 함께 글쓰기 실력을 키워보세요.</>}
          </p>
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <RoundedButton className='w-[330px] md:mx-0 mx-auto dark:text-black'>
              {isLoggedIn ? <Link href="/writing-class/downloads">{language === "en" ? "Download Free Book of 5"
                : "무료로 작법서 다운 받기"}
              </Link>
                : <>
                  <Link href="#" onClick={() => {
                    const fileKey = language === "ko" ? file.file_url_ko : file.file_url_en || file.file_url_ko;
                    console.log(`Download clicked: ${fileKey} (${language})`);
                    downloadFile(fileKey);
                  }}>
                    {language === "en" ? "Preview Free Book of 5"
                      : "무료로 작법서 5강 보기"}
                  </Link>
                  {/* <LoginDialog /> */}
                </>
              }
            </RoundedButton>
          </Dialog>
        </div>

        <div className="md:w-1/2 relative md:order-2 order-2 hidden md:block">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-4">
              <BookCard
                title={language === "en" ? "1. Webnovel Writing" : "1. 웹소설의 세계로"}
                author={language === "en" ? "Become a Digital Storyteller" : "디지털 시대의 이야기꾼 되기"}
                color="bg-[#DBE9FE]"
                imageUrl="/writing-class/images/bookcover/book1.svg"
              />
              <BookCard
                title={language === "en" ? "4. Create Vivid Characters" : "4. 생생한 캐릭터 창조하기"}
                author={language === "en" ? "Create Characters" : "독자의 마음을 훔치는 인물 만들기"}
                color="bg-[#DCFCE5]"
                imageUrl="/writing-class/images/bookcover/book4.svg"
              />
            </div>
            <div className="col-span-1 space-y-4 mt-8">
              <BookCard
                title={language === "en" ? "2. Create Your Own Story" : "2. 나만의 이야기 씨앗 심기"}
                author={language === "en" ? "Discover and Develop Creative Ideas" : "창의적 아이디어 발굴과 개발"}
                color="bg-[#FFE020]"
                imageUrl="/writing-class/images/bookcover/book2.svg"
              />
              <BookCard
                title={language === "en" ? "5. The Secret of First Sentence" : "5. 첫 문장에서 마지막 문장까지"}
                author={language === "en" ? "Writing Techniques" : "강렬한 도입부 작성의 기술"}
                color="bg-[#FED6A7]"
                imageUrl="/writing-class/images/bookcover/book5.svg"
              />
            </div>
            <div className="col-span-1 space-y-4 mt-16">
              <BookCard
                title={language === "en" ? "3. Storytelling Techniques" : "3. 독자를 이끄는 스토리텔링 기술"}
                author={language === "en" ? "Break the Clichés" : "클리셰를 깨부순 글쓰기 노하우"}
                color="bg-[#E8D4FF]"
                imageUrl="/writing-class/images/bookcover/book3.svg"
              />
              <BookCard
                title={language === "en" ? "6. Editing and Revising" : "6. 완성도를 높이는 수정과 편집"}
                author={language === "en" ? "Revising Effectively" : "효과적인 수정과 편집 방법"}
                color="bg-[#FCCEE8]"
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
                {language === "en" ? "TOONYZ Writing Guide Book"
                  : "투니즈 글쓰기 가이드 작법서 출간"}
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
              {language === "en" ? "Toonyz Writing 101 book is now available! Get the full guide to creating a high-quality fiction."
                : <>웹소설 글쓰기의 전 과정 안내를 해 드리는 투니즈 글쓰기 작법서가 출시 되었습니다. <br /> 지금 바로 가입하고 무료로 다운 받으세요! <br />

                </>}
            </p>
          </div>
        </div>
      </section>


      {/* Categories Section */}
      <section className="w-full mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {language === "en" ? "TOP Writing Guide" : "TOP 작법서 시리즈"}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto whitespace-pre-line break-keep">
            {language === "en" ? "Introducing the best writing guide books that has received the most love." : "가장 많은 사랑을 받은 베스트 작법서를 소개합니다."}
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
            </div>
            <BookShelf />
          </section>
        </div>
      </section>

      {/* Program Details Section */}
      <section className="relative flex flex-col items-center justify-center py-16 bg-gray-100">
        <div className="flex md:flex-row flex-col justify-center items-center">

        </div>
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
          <h2 className="text-xl md:text-4xl font-bold mb-6 break-keep">
            {language === "en" ? "Webnovel Writing is now possible with Toonyz Writing Class"
              : "웹소설 작가 데뷔는 투니즈 글쓰기 101로 가능합니다 "}
          </h2>
          <p className="md:text-xl text-sm mb-8 mx-auto break-keep">
            {language === "en" ? "One day 10 minutes, one month 200, a webnovel writer/e-book PDF side hustle, it's no longer a dream!"
              : "하루 10분 일하고 월 200 꾸준히 버는 웹소설 작가/전자책 PDF 부업, 이제 꿈이 아닙니다!"}
          </p>
          <p className="md:text-xl text-sm mx-auto break-keep">
            {language === "en" ? "Once you finish the Toonyz Writing Class,"
              : "투니즈 글쓰기 101 작법서를 완독하면,"}
          </p>


          <div className="max-w-screen-md mx-auto md:p-10 p-4">
            <hr className="border border-gray-300 mb-8" />
            <ul className="md:text-xl text-sm grid grid-cols-1 gap-4 text-black text-left">
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Offer a special one-to-one feedback"
                  : "내부 심사 후 체계적으로 완성된 1:1 피드백 제공"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "You get premium benefits when you write in Toonyz"
                  : "투니즈에 연재시 내부 추천 후 프리미엄 혜택 부여 및 제공"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Exclusive opportunity to create Toonyz original IP* (depends on completion)"
                  : "투니즈 오리지널 IP 독점 기회 제공* (완성도에 따라 다름)"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Master webnovel guide series 6"
                  : "투니즈 웹소설/전자책 시리즈 6권 무료 제공"}</p>
                <p>✅</p>
              </li>
              <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                <p>{language === "en" ? "Complete webnovel writer's debut roadmap"
                  : "웹소설 작가의 데뷔 완벽 로드맵 제공"}</p>
                <p>✅</p>
              </li>
            </ul>
          </div>

          <div className="py-16">
            <RoundedButton className='w-[330px] mx-auto'>
              <Link href="/writing-class/downloads">
                {language === "en" ? "Download Free e-book"
                  : "무료로 5강 다운로드 받기"}
              </Link>
            </RoundedButton>
            <p className="mt-4 text-sm">
              {language === "en" ? "Easy login to download"
                : "간편 로그인으로 바로 다운로드 가능해요"}
            </p>
          </div>
        </div>
      </section>

      <section className="relative w-full h-full mx-auto md:p-10 md:pb-16 p-0">
        <div className="absolute inset-0 bg-black/80  z-50 flex flex-col items-center justify-center">
          <h1 className="inline-flex flex-col gap-2 items-center text-white md:text-4xl text-2xl font-bold text-center">
            <Info className="w-10 h-10" />
            <span> {language === "en" ? "Ended Session" : "종료된 세션입니다. 감사합니다."} </span>
          </h1>
        </div>
        <div className="relative container md:max-w-screen-md mx-auto pb-8">
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
                    모집기간: 4월 18일 ~ 5월 6일 까지
                  </p>
                </li>
                <li className="bg-gray-50 p-4 rounded-md inline-flex items-center justify-between">
                  <p className="font-bold md:text-2xl text-xl">{language === "en" ? "Duration" : "시간"}</p>
                  <p className="text-right md:text-md text-sm">
                    4주 (주 2회 실시간 Zoom 세션) <br />
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

          <div className="flex flex-col items-center justify-center">
            <Button disabled={true} className="w-[330px] mx-auto self-center">
              {language === "en" ? "Session Ended" : "종료된 세션입니다. 감사합니다."}
            </Button>
            {/* <RoundedButton backgroundColor="#000000" className="w-[330px] mx-auto ">
                <Link href="#">
                  {language === "en" ? "Reserve Your Spot Now" : "지금 바로 예약하기"}
                </Link>
              </RoundedButton> */}
            <p className="text-center text-sm text-[#DE2B74] mt-3">
              {language === "en" ? "Only 20 writers will be accepted."
                : "최대 20명의 예비 작가만 수용합니다."}
              <span className="text-black">*</span>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {language === "en" ? "What Our Writers Say"
              : "수강생 작가들의 이야기"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                over 500,000 reads on Webnovel!
              </p>
            </div>

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
      </section> */}

      {/* <section className="py-12 bg-[#DE2B74]">
        <div className="relative container mx-auto px-4 text-center">
          
          <h2 className="text-3xl font-bold text-white mb-8">
            {language === "en" ? "Limited Spots Available!"
              : "얼마 남지 않은 기회입니다!"}
          </h2>
          <CountdownTimer targetDate="2025-05-30" className="text-white" />
          <p className="text-xl mb-8 text-white max-w-2xl mx-auto whitespace-pre-line break-keep">
            {language === "en" ? <>Those books are free now, but they will be converted to paid content soon.<br /></>
              : <>이 작법서는 현재 무료이지만 유료 컨텐츠로 전환될 예정입니다 <br /></>}
            {language === "en" ? "Download them today and start your journey to becoming a successful web novel writer."
              : "지금 바로 다운받고 성공적인 웹소설 작가로 시작하세요."}
          </p>

        </div>
      </section> */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <FaqSection />
      </section>
    </div>
  )
}
