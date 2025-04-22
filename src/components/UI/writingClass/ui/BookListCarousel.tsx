"use client"

import { useEffect, useRef, useState } from "react";
import { BookCoverCard } from "@/components/UI/writingClass/ui/BookCoverCard";
import { Dialog } from "@/components/shadcnUI/Dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import BookDetailDialog from "@/components/UI/writingClass/ui/BookDetailDialog";
import { CourseBook } from "@/components/Types";
import Link from "next/link";
export function BookListCarousel() {
  const { language } = useLanguage();
  const categories: CourseBook[] = [
    {
      id: 1,
      title: "작법서 1",
      title_en: "Into the World of Web Novels",
      subtitle: "디지털 시대의 이야기꾼 되기",
      subtitle_en: "Become a storyteller in the digital age",
      coverImage: "/images/bookcover/book1.svg",
      author: "",
      coverColor: "#f5f5f7"
    },
    {
      id: 2,
      title: "작법서 2",
      title_en: "Plant Your Own Story Seeds",
      subtitle: "창의적 아이디어 발굴과 개발",
      subtitle_en: "Unleash your creativity and develop your ideas",
      coverImage: "/images/bookcover/book2.svg",
    },
    {
      id: 3,
      title: "작법서 3",
      title_en: "Break the clichés and create myths",
      subtitle: "클리셰를 깨부수고 신화를 창조하기",
      subtitle_en: "Break the clichés and create myths",
      coverImage: "/images/bookcover/book3.svg",
    },
    {
      id: 4,
      title: "작법서 4",
      title_en: "Create Vivid Characters",
      subtitle: "독자의 마음을 훔치는 인물 만들기",
      subtitle_en: "Create characters that steal readers' hearts",
      coverImage: "/images/bookcover/book4.svg",
    },
    {
      id: 5,
      title: "작법서 5",
      title_en: "From the First Sentence to the Last",
      subtitle: "첫 문장으로 독자를 사로잡아라, 강렬한 도입부 작성의 기술",
      subtitle_en: "Write a gripping first sentence to captivate your readers",
      coverImage: "/images/bookcover/book5.svg",
    },
    {
      id: 6,
      title: "작법서 6",
      title_en: "The Art of Editing and Revising",
      subtitle: "퇴고로 작품에 생명을 불어넣다, 효과적인 수정과 편집 방법",
      subtitle_en: "Revise your work to give it life, and learn effective editing techniques",
      coverImage: "/images/bookcover/book6.svg",
    },
    {
      id: 7,
      title: "작법서 7",
      title_en: "Publishing and marketing strategies",
      subtitle: "작가도 마케터다! - 효과적인 자기 홍보와 브랜드 구축",
      subtitle_en: "Authors are also marketers! - Effective self-promotion and brand building",
      coverImage: "/images/bookcover/book7.svg",
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
            <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setSelectedBook(category as unknown as CourseBook)
                }}>
                <BookCoverCard
                  title={language === "en" ? (category.title_en || category.title) : category.title}
                  description={language === "en" ? (category.subtitle_en || category.subtitle) : category.subtitle}
                  coverImage={category.coverImage || ""}
                />
              </Link>
              <BookDetailDialog selectedBook={selectedBook} setSelectedBook={setSelectedBook} />
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
