"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/shadcnUI/Button"
import Link from "next/link"

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
}

interface TabData {
  id: string
  label: string
  icon?: string
  books: Book[]
}

export function BookTab() {

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
          originalPrice: 49,
          salePrice: 19,
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
          originalPrice: 49,
          salePrice: 19,
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
          originalPrice: 49,
          salePrice: 19,
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
          originalPrice: 49,
          salePrice: 19,
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
          originalPrice: 49,
          salePrice: 19,
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
          originalPrice: 49,
          salePrice: 19,
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
          originalPrice: 49,
          salePrice: 19,
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
      <div className="flex flex-wrap justify-center gap-2 mb-12">
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
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedBooks.map((book) => (
          <div key={book.id} className="relative flex flex-col">
            {/* Book Cover */}
            <div className={`${book.coverColor} p-8 rounded-lg mb-4 shadow-md relative`}>
              <div className="bg-transparent aspect-[2/3] rounded transform rotate-0 transition-transform hover:rotate-3 duration-300">
                <Image
                  src={book.coverImage || "/coverArt_thumbnail.png"}
                  alt={book.title}
                  width={100}
                  height={150}
                  className="w-full object-cover"
                />
              </div>
              {/* overlay */}
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center py-10">
                  <h1 className="text-xl font-bold">{language === "en" ? book.subtitle_en : book.subtitle}</h1>
                  <p className="text-lg whitespace-pre-line break-keep">{language === "en" ? book.description_en : book.description}</p>
                  <div className="flex">
                    {book.id === "writing-5" ? (
                      <Button
                        variant="outline"
                        className="bg-[#DE2B74] hover:bg-[#DE2B74]/40 text-white text-center p-4 text-xl font-bold cursor-pointer">
                        <Link href="/writing-class/downloads">
                          {language === "en" ? "Download" : "다운받기"}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="text-black hover:bg-black hover:text-white text-center p-4 text-xl font-bold cursor-pointer">
                        {language === "en" ? "Not available" : "준비중"}
                      </Button>)}
                  </div>
                </div>
              </div>
            </div>


            {/* Book Details */}
            <div>
              <p className="text-blue-500 font-medium">{book.author}</p>
              <h3 className="text-xl font-bold text-gray-800 mt-1 mb-2">
                {language === "en" ? book.title_en : book.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {language === "en" ? book.subtitle_en : book.subtitle}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 line-through">
                  ${book.originalPrice}
                </span>
                <span className="text-xl font-bold text-gray-800">
                  {/* ${book.salePrice} */}
                  Free
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
