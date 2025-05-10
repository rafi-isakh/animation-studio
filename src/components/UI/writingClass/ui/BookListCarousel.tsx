"use client"

import { useEffect, useRef, useState } from "react";
import { BookCoverCard } from "@/components/UI/writingClass/ui/BookCoverCard";
import { Dialog } from "@/components/shadcnUI/Dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import BookDetailDialog from "@/components/UI/writingClass/ui/BookDetailDialog";
import { CourseBook } from "@/components/Types";
import Link from "next/link";
export function BookListCarousel({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { language } = useLanguage();
  const categories: CourseBook[] = [
    {
      id: 1,
      title: "작법서 1",
      title_en: "Into the World of Web Novels",
      subtitle: "디지털 시대의 이야기꾼 되기",
      subtitle_en: "Become a storyteller in the digital age",
      coverImage: "/writing-class/images/bookcover/book1.svg",
      author: "",
      coverColor: "#f5f5f7",
      description: "하루 2분 만에 승부가 난다! 독자의 시선을 단숨에 사로잡는 웹소설 쓰기. 소설이 기존 장르 소설과 무엇이 다른지 알아볼까요? 웹소설과 전통 소설의 가장 큰 차이점은, 전통 소설이 독자와 천천히 교감하며 깊이를 쌓아가는 마라톤이라면, 웹소설은 독자의 관심을 빠르게 사로잡아야 하는 단거리 경주와 비슷합니다.... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_1_ko.pdf",
      file_url_en: "writing_guide_1_en.pdf",
    },
    {
      id: 2,
      title: "작법서 2",
      title_en: "Plant Your Own Story Seeds",
      subtitle: "창의적 아이디어 발굴과 개발",
      subtitle_en: "Unleash your creativity and develop your ideas",
      coverImage: "/writing-class/images/bookcover/book2.svg",
      description: "“스타벅스에서 듣게 된 대화 하나가 베스트셀러 소재가 될 수도 있다!” 장르 선택의 비밀 - 자신에게 맞는 장르 찾기와 타겟 독자층 파악 전략을 파악하자, 일상에서 건지는 보석 같은 아이디어를 알려드려요... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_2_ko.pdf",
      file_url_en: "writing_guide_2_en.pdf",
    },
    {
      id: 3,
      title: "작법서 3",
      title_en: "Break the clichés and create myths",
      subtitle: "클리셰를 깨부수고 신화를 창조하기",
      subtitle_en: "Break the clichés and create myths",
      coverImage: "/writing-class/images/bookcover/book3.svg",
      description: "진부함을 탈피한 신선한 스토리 구성법을 배워보자 플롯의 마법: 기승전결을 넘어서는 이야기 구조를 배우는 시간,전통적 스토리 구조 vs. 웹소설형 구조 2) 3막·5막 구조 영화나 장편소설의 전형 → 웹소설은 매 화마다 미니 클라이맥스 3) 다층적 플롯(메인+서브 플롯) 구성 4)로맨스 + 서스펜스, 판타지 + 성장 드라마 등 장르 믹스 활용... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_3_ko.pdf",
      file_url_en: "writing_guide_3_en.pdf",
    },
    {
      id: 4,
      title: "작법서 4",
      title_en: "Create Vivid Characters",
      subtitle: "독자의 마음을 훔치는 인물 만들기",
      subtitle_en: "Create characters that steal readers' hearts",
      coverImage: "/writing-class/images/bookcover/book4.svg",
      description: "평면적인 캐릭터는 가라! 입체적이고 매력적인 인물 창조의 비결 “독자의 마음을 훔치는 인물 만들기” 평면적인 캐릭터는 독자의 기억에서 빠르게 사라집니다. 진정으로 기억에 남는 이야기는 입체적이고 매력적인 주인공이 이끌어 갑니다. 그렇다면 어떻게 이런 캐릭터를 창조할 수 있을까요?... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_4_ko.pdf",
      file_url_en: "writing_guide_4_en.pdf",
    },
    {
      id: 5,
      title: "작법서 5",
      title_en: "From the First Sentence to the Last",
      subtitle: "첫 문장으로 독자를 사로잡아라, 강렬한 도입부 작성의 기술",
      subtitle_en: "Write a gripping first sentence to captivate your readers",
      coverImage: "/writing-class/images/bookcover/book5.svg",
      description: "독자의 시선을 사로잡는 웹소설 오프닝 기법 – 웹소설을 쓰는 작가라면 반드시 기억해야 할 문장이 있습니다. ‘첫 문장이 모든 것을 결정한다’는 것. 현대 독자는 참을성이 없습니다. 그들이 당신의 글을 선택할 시간은, 고작 몇 초. 그렇다고 오프닝은 ‘낚시’라는뜻은 아닙니다... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_5_ko.pdf",
      file_url_en: "writing_guide_5_en.pdf",
    },
    {
      id: 6,
      title: "작법서 6",
      title_en: "The Art of Editing and Revising",
      subtitle: "퇴고로 작품에 생명을 불어넣다, 효과적인 수정과 편집 방법",
      subtitle_en: "Revise your work to give it life, and learn effective editing techniques",
      coverImage: "/writing-class/images/bookcover/book6.svg",
      description: "자기 점검과 피드백 활용법을 배워봅니다. - 자신의 글을 객관적으로 평가하고 개선하는 방법, 문장 다듬기의 기술이란?  오탈자·번역체 수정, 자동 교정툴 + 직접 낭독하며 어색한 부분 확인... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_6_ko.pdf",
      file_url_en: "writing_guide_6_en.pdf",
    },
    {
      id: 7,
      title: "작법서 7",
      title_en: "Publishing and marketing strategies",
      subtitle: "작가도 마케터다! - 효과적인 자기 홍보와 브랜드 구축",
      subtitle_en: "Authors are also marketers! - Effective self-promotion and brand building",
      coverImage: "/writing-class/images/bookcover/book7.svg",
      description: "작가도 마케터다!: - 효과적인 자기 홍보와 브랜드 구축 방법 소개, 최적의 플랫폼 선택과 투고 전략, “왓패드, 웹노블 등 주요 플랫폼의 특징과 활용법”을 배워보자.... 본문 생략",
      description_en: "",
      file_url_ko: "writing_guide_7_ko.pdf",
      file_url_en: "writing_guide_7_en.pdf",
    },
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Autoplay functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % categories.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [categories.length])

  // Update scroll position when activeIndex changes
  useEffect(() => {
    if (carouselRef.current) {
      const scrollAmount = activeIndex * (carouselRef.current.scrollWidth / categories.length)
      carouselRef.current.scrollTo({
        left: scrollAmount,
        behavior: "smooth",
      })
    }
  }, [activeIndex, categories.length])

  const [selectedBook, setSelectedBook] = useState<CourseBook | null>(null)

  return (
    <div className="relative">
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <div
            key={category.id}
            className="min-w-[300px] md:min-w-[350px] px-3 snap-start flex-shrink-0"
            style={{ width: "calc(100% / 3)" }}
          >
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setSelectedBook(category as CourseBook)
                }}>
                <BookCoverCard
                  title={language === "en" ? (category.title_en || category.title) : category.title}
                  description={language === "en" ? (category.subtitle_en || category.subtitle) : category.subtitle}
                  coverImage={category.coverImage || ""}
                  language={language}
                  id={category.id}
                />
              </Link>
             <Dialog open={!!selectedBook} onOpenChange={(isOpen) => !isOpen && setSelectedBook(null)}>
              <BookDetailDialog selectedBook={selectedBook} setSelectedBook={setSelectedBook} language={language} isLoggedIn={isLoggedIn} />
            </Dialog>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => setActiveIndex((current) => (current - 1 + categories.length) % categories.length)}
        className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-2 shadow-md z-10 hidden md:block"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-left"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => setActiveIndex((current) => (current + 1) % categories.length)}
        className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white rounded-full p-2 shadow-md z-10 hidden md:block"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-right"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}
