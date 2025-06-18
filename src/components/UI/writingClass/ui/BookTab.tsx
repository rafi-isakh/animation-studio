"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import Image from "next/image"
import { cn } from "@/lib/utils"
import PDFviewButton from "@/components/UI/writingClass/ui/PDFviewButton"
import { motion } from "framer-motion"
import gsap from "gsap"
import { ArrowUpRight } from "lucide-react"

interface Book {
  id: string
  title: string
  title_en: string
  author?: string
  subtitle: string
  subtitle_en: string
  description: string
  description_en: string
  coverImage: string
  coverColor?: string
  originalPrice?: number
  salePrice?: number
  genre?: string[]
  file_url_ko?: string
  file_url_en?: string
}

interface TabData {
  id: string
  label: string
  icon?: string
  books: Book[]
}

const scaleAnimation = {
  initial: { scale: 0, x: "-50%", y: "-50%" },
  enter: { scale: 1, x: "-50%", y: "-50%", transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] } },
  closed: { scale: 0, x: "-50%", y: "-50%", transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] } }
}

export const slideLeft = {
  initial: {
    x: 0
  },
  animate: {
    x: "-100%",
    transition: {
      duration: 10,
      ease: "linear",
      repeat: Infinity
    }
  }
}

export function BookTab({ isLoggedIn, mode = 'writing-class' }: { isLoggedIn: boolean, mode?: 'writing-class' | 'sbs' }) {

  const tabs: TabData[] = [
    {
      id: "writing",
      label: "Writing",
      icon: "🖋️",
      books: [
        {
          id: "writing-1",
          title: "1강 웹소설의 세계로",
          title_en: "Into the World of Web Novels",
          author: "",
          genre: ["writing"],
          subtitle: "디지털 시대의 이야기꾼 되기",
          subtitle_en: "Become a storyteller in the digital age",
          description: "용기를 내어 첫 발을 내딛으세요, 웹소설 작가의 여정은 쉽지 않지만 그만큼 보람 있는 시작입니다. 완벽하지 않아도 좋으니, 일단 시작하는 것이 가장 중요! 투니즈 콘텐츠 전문가와 함께 글쓰기를 체계적으로 알려드립니다.",
          description_en: "Start your journey as a web novel writer. It's not easy, but it's rewarding. Don't worry about being perfect, just start. We'll guide you systematically with the help of our content experts.",
          coverImage: "/writing-class/images/bookcover/book1.svg",
          coverColor: "bg-[#DBE9FE]",
          file_url_ko: "writing_guide_1_ko.pdf",
          file_url_en: "writing_guide_1_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-2",
          title: "2강 나만의 이야기 씨앗 심기",
          title_en: "Plant Your Own Story",
          author: "",
          genre: ["writing"],
          subtitle: "창의적 아이디어 발굴과 개발",
          subtitle_en: "Unleash your creativity and develop your ideas",
          description: "웹소설 작가들이 일상에서 창의적인 소재를 발굴하고, 이를 발전시키는 방법을 AtoZ 로 알려드립니다. 장르 불문, 사회구조·경제·문화 등 현실적 디테일까지 완벽하게 전달 할 수 있습니다.",
          description_en: "We'll guide you systematically with the help of our content experts.",
          coverImage: "/writing-class/images/bookcover/book2.svg",
          coverColor: "bg-[#FFE020]",
          file_url_ko: "writing_guide_2_ko.pdf",
          file_url_en: "writing_guide_2_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-3",
          title: "3강 독자를 사로잡는 스토리텔링의 기술",
          title_en: "The Art of Storytelling that Captures Readers",
          author: "",
          genre: ["writing"],
          subtitle: "클리셰를 깨부수고 신화를 창조하기",
          subtitle_en: "Break the clichés and create myths",
          description: "진부함을 탈피해 독자의 몰입을 유도하는 신선한 스토리 구성법에 대해 알려드립니다.",
          description_en: "Typically, we're used to the same old stories. But, we can create a creative stories that captivate readers.",
          coverImage: "/writing-class/images/bookcover/book3.svg",
          coverColor: "bg-[#E8D4FF]",
          file_url_ko: "writing_guide_3_ko.pdf",
          file_url_en: "writing_guide_3_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-4",
          title: "4강 생생한 캐릭터 창조하기",
          title_en: "Create Vivid Characters",
          author: "",
          genre: ["writing"],
          subtitle: "독자의 마음을 훔치는 인물 만들기",
          subtitle_en: "Create characters that steal readers' hearts",
          description: "입체적이고 매력적인 인물 창조의 비결, 완벽한 인물보다 모순이 있는 캐릭터 창조의 비법을 아시나요? 더 현실적이고 매력적인 캐릭터를 만들기 위한 팁을 알려드립니다.",
          description_en: "There are many ways to create a character. But, we can create a vivid character that captivate readers.",
          coverImage: "/writing-class/images/bookcover/book4.svg",
          coverColor: "bg-[#DCFCE5]",
          file_url_ko: "writing_guide_4_ko.pdf",
          file_url_en: "writing_guide_4_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-5",
          title: "5강 첫 문장에서 마지막 문장까지",
          title_en: "From the First Sentence to the Last",
          author: "",
          genre: ["writing"],
          subtitle: "첫 문장으로 독자를 사로잡아라, 강렬한 도입부 작성의 기술",
          subtitle_en: "Write a gripping first sentence to captivate your readers",
          description: "궁금증 유발이 핵심인 첫 문장에서 독자의 몰입을 유도하는 방법을 알려드립니다.",
          description_en: "The beginning of the story is the most important part. We'll guide you a gripping first sentence to captivate your readers.",
          coverImage: "/writing-class/images/bookcover/book5.svg",
          coverColor: "bg-[#FED6A7]",
          file_url_ko: "writing_guide_5_ko.pdf",
          file_url_en: "writing_guide_5_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-6",
          title: "6강 완성도를 높이는 수정과 편집의 예술",
          title_en: "The Art of Editing and Revising to Elevate Your Work",
          author: "",
          genre: ["writing"],
          subtitle: "퇴고로 작품에 생명을 불어넣다, 효과적인 수정과 편집 방법",
          subtitle_en: "Revise your work to give it life, and learn effective editing techniques",
          description: "완성도를 높이는 수정과 편집의 예술, 완벽한 작품을 만들기 위한 팁을 알려드립니다.",
          description_en: "The art of editing and revising to elevate your work, and tips to make a perfect work.",
          coverImage: "/writing-class/images/bookcover/book6.svg",
          coverColor: "bg-[#FCCEE8]",
          file_url_ko: "writing_guide_6_ko.pdf",
          file_url_en: "writing_guide_6_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-7",
          title: "7강 작가로서의 길",
          title_en: "The Path to Becoming a Writer",
          author: "",
          genre: ["writing"],
          subtitle: "출판과 마케팅 전략",
          subtitle_en: "Publishing and Marketing Strategies",
          description: "웹소설 작가로서의 마케팅 전략을 알려드립니다.",
          description_en: "The best way to market your web novel!",
          coverImage: "/writing-class/images/bookcover/book7.svg",
          coverColor: "bg-[#8EC4FF]",
          file_url_ko: "writing_guide_7_ko.pdf",
          file_url_en: "writing_guide_7_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
        {
          id: "writing-8",
          title: "8강 웹소설의 OSMU 확장 비법",
          title_en: "OSMU Extension Method for Web Novels",
          author: "",
          genre: ["writing"],
          subtitle: "웹소설 작품의 무한 변신 - 2차 창작 OSMU 확장 비법",
          subtitle_en: "Infinite transformations of web novels - OSMU extension method for secondary creations",
          description: "웹소설의 OSMU로 수입은 물론 더 많은 가능성과 무한한 비법을 알려드립니다.",
          description_en: "Learn how to use OSMU to expand your web novel, including importing and more possibilities.",
          coverImage: "/writing-class/images/bookcover/book8.svg",
          coverColor: "bg-[#C8E126]",
          file_url_ko: "writing_guide_8_ko.pdf",
          file_url_en: "writing_guide_8_en.pdf",
          originalPrice: 20,
          salePrice: 0,
        },
      ],
    },

  ]

  const [activeTab, setActiveTab] = useState("writing")
  const currentBooks = tabs.find((tab) => tab.id === activeTab)?.books;

  const sortedBooks = currentBooks
    ? [...currentBooks].sort((a, b) => {
      // Sort by the first genre in the array, handle undefined/empty arrays
      const genreA = a.genre?.[0] || '';
      const genreB = b.genre?.[0] || '';
      return genreA.localeCompare(genreB, undefined, { sensitivity: 'base' });
    })
    : [];

  const { language } = useLanguage();
  const modalContainer = useRef<HTMLDivElement>(null);

  const cursor = useRef<HTMLDivElement>(null);
  const cursorLabel = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState({ active: false, index: 0 })
  const { active, index } = modal;

  let xMoveContainer = useRef<((value: number) => void) | null>(null);
  let yMoveContainer = useRef<((value: number) => void) | null>(null);
  let xMoveCursor = useRef<((value: number) => void) | null>(null);
  let yMoveCursor = useRef<((value: number) => void) | null>(null);
  let xMoveCursorLabel = useRef<((value: number) => void) | null>(null);
  let yMoveCursorLabel = useRef<((value: number) => void) | null>(null);

  useEffect(() => {
    //Move Container
    xMoveContainer.current = gsap.quickTo(modalContainer.current, "left", { duration: 0.8, ease: "power3" })
    yMoveContainer.current = gsap.quickTo(modalContainer.current, "top", { duration: 0.8, ease: "power3" })
    //Move cursor
    xMoveCursor.current = gsap.quickTo(cursor.current, "left", { duration: 0.5, ease: "power3" })
    yMoveCursor.current = gsap.quickTo(cursor.current, "top", { duration: 0.5, ease: "power3" })
    //Move cursor label
    xMoveCursorLabel.current = gsap.quickTo(cursorLabel.current, "left", { duration: 0.45, ease: "power3" })
    yMoveCursorLabel.current = gsap.quickTo(cursorLabel.current, "top", { duration: 0.45, ease: "power3" })
  }, [])

  const moveItems = (x: number, y: number) => {
    if (modalContainer.current) {
      const rect = modalContainer.current.getBoundingClientRect();
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      xMoveContainer.current?.(relativeX)
      yMoveContainer.current?.(relativeY)
      xMoveCursor.current?.(relativeX)
      yMoveCursor.current?.(relativeY)
      xMoveCursorLabel.current?.(relativeX)
      yMoveCursorLabel.current?.(relativeY)
    }
  }

  useEffect(() => {
    if (modalContainer.current) {
      const bounds = modalContainer.current.getBoundingClientRect();
      if (bounds.top < 0) {
        gsap.set(modalContainer.current, { x: "-100%" })
        gsap.set(modalContainer.current, { x: "100%" })
      }
      else {
        gsap.set(modalContainer.current, { x: "100%" })
        gsap.set(modalContainer.current, { x: "-100%" })
      }
      gsap.to(modalContainer.current, { x: "0%", duration: 0.3 })
    }
  }, [])



  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-gray-700 font-medium mb-2">UP TO 99% OFF</p>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          {language === "en" ? "Toonyz Writing Guide Series" : "투니즈 작법서 시리즈"}
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto whitespace-pre-line break-keep">
          {language === "en" ? "We offer a wide range of writing guides, and Web novel writing, and reference books."
            : <>체계적인 글쓰기 가이드와 웹소설 작가가 될 수 있는 참고서를 제공합니다.<br /></>}
          {language === "en" ? <><br />Whenever you&apos;re free, study your own way.</>
            : "언제든 편하게 공부할 수 있도록 누구든지 손쉽게 따라할 수 있는 워크북을 제공합니다."}
        </p>
      </div>
      {/* Tabs */}
      {/* <div className="flex flex-wrap justify-center gap-2 mb-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-colors",
              activeTab === tab.id ? "bg-gray-800 text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100",
            )}
          >
            {tab.icon}{' '}
            {tab.label}
          </button>
        ))}
      </div> */}

      {/* Books Grid */}
      <motion.div
        ref={modalContainer}
        initial="initial"
        animate={active ? "enter" : "closed"}
        onMouseMove={(e) => { moveItems(e.clientX, e.clientY) }}
        className="flex items-center justify-center">
        <motion.div
          onMouseEnter={() => setModal(prev => ({ ...prev, active: true }))}
          onMouseLeave={() => setModal(prev => ({ ...prev, active: false }))}
          className="relative mx-auto md:w-screen w-full h-full overflow-hidden">
          <div className={`grid grid-cols-1 md:grid-cols-${mode === 'writing-class' ? '3' : '4'} lg:grid-cols-${mode === 'writing-class' ? '3' : '4'} gap-8`}>
            {sortedBooks.map((book) => (
              <div key={book.id} className="relative flex flex-col">
                {/* Book Cover */}
                <div className={`${book.coverColor} p-8 rounded-lg mb-4 shadow-md relative`}>
                  <div className="bg-transparent aspect-[2/3] rounded transform rotate-0 transition-transform hover:rotate-3 duration-300">
                    <Image
                      src={book.coverImage || "/coverArt_thumbnail.png"}
                      alt={book.title}
                      width={60}
                      height={100}
                      className="w-full object-cover"
                    />
                  </div>
                  {/* overlay */}
                  <div className="absolute inset-0 bg-white opacity-0 hover:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center py-10">
                      <h1 className="text-xl font-bold ">{language === "en" ? book.subtitle_en : book.subtitle}</h1>
                      <p className="text-sm whitespace-pre-line break-keep">{language === "en" ? book.description_en : book.description}</p>
                      <div className="flex">
                        <PDFviewButton
                          mode="modal"
                          language={language}
                          title={language === "en" ? "Preview" : "미리보기"}
                          file_url_en={book.file_url_en || ""}
                          file_url_ko={book.file_url_ko || ""}
                          isLoggedIn={isLoggedIn === null ? undefined : isLoggedIn}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Book Details */}
                <div>
                  <p className="text-blue-500 font-medium">{book.author}</p>
                  <h3 className="text-lg font-bold text-gray-800 mt-1 mb-2">
                    {language === "en" ? book.title_en : book.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-xs">
                    {language === "en" ? book.subtitle_en : book.subtitle}
                  </p>
                  <div className="flex flex-col md:items-start md:justify-start items-center gap-2">
                    <span className="text-gray-400 line-through text-xs">
                      Amazon Kindle ${book.originalPrice}
                    </span>
                    <p className="font-bold text-gray-800 text-sm">
                      {book.salePrice === 0 ? language === "en" ? <>Free</> : <>투니즈 회원 무료 다운로드</> : <>${book.salePrice}</>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div ref={cursorLabel} className='bg-amber-400 text-white rounded-full px-4 py-4 absolute top-0 left-0 pointer-events-none z-50' variants={scaleAnimation} initial="initial" animate={active ? "enter" : "closed"}><ArrowUpRight size={50} strokeWidth={1} /></motion.div>
      </motion.div>
    </section>
  )
}
