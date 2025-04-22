"use client"
import { ScrollArea, ScrollBar } from "@/components/shadcnUI/ScrollArea"
import { Dialog } from "@/components/shadcnUI/Dialog"
import { useState } from "react"
import { CourseBook } from "@/components/Types"
import { useLanguage } from "@/contexts/LanguageContext";
import BookDetailDialog from "@/components/UI/writingClass/ui/BookDetailDialog"

export default function BookShelf() {
    const { language } = useLanguage();
    const [selectedBook, setSelectedBook] = useState<CourseBook | null>(null);
    const books: CourseBook[] = [
        {
            id: 1,
            title: "1강 웹소설의 세계로",
            title_en: "Into the World of Web Novels",
            subtitle: "디지털 시대의 이야기꾼 되기",
            subtitle_en: "Become a storyteller in the digital age",
            author: "",
            coverColor: "#f5f5f7",
            coverImage: "/writing-class/images/bookcover/book1.svg",
            description: "하루 2분 만에 승부가 난다! 독자의 시선을 단숨에 사로잡는 웹소설 쓰기. 소설이 기존 장르 소설과 무엇이 다른지 알아볼까요? 웹소설과 전통 소설의 가장 큰 차이점은, 전통 소설이 독자와 천천히 교감하며 깊이를 쌓아가는 마라톤이라면, 웹소설은 독자의 관심을 빠르게 사로잡아야 하는 단거리 경주와 비슷합니다.... 본문 생략",
            description_en: "",
        },
        {
            id: 2,
            title: "2강 나만의 이야기 씨앗 심기",
            title_en: "Plant Your Own Story Seeds",
            subtitle: "창의적 아이디어 발굴과 개발",
            subtitle_en: "Unleash your creativity and develop your ideas",
            author: "Jane Austen",
            coverColor: "#f8a08a",
            textColor: "#000",
            coverImage: "/writing-class/images/bookcover/book2.svg",
            description: "“스타벅스에서 듣게 된 대화 하나가 베스트셀러 소재가 될 수도 있다!” 장르 선택의 비밀 - 자신에게 맞는 장르 찾기와 타겟 독자층 파악 전략을 파악하자, 일상에서 건지는 보석 같은 아이디어를 알려드려요... 본문 생략",
            description_en: "",
        },
        {
            id: 3,
            title: "3강 독자를 사로잡는 스토리텔링의 기술",
            title_en: "The Art of Storytelling that Captures Readers",
            subtitle: "클리셰를 깨부수고 신화를 창조하기",
            subtitle_en: "Break the clichés and create myths",
            author: "",
            coverColor: "#f5f5f7",
            coverImage: "/writing-class/images/bookcover/book3.svg",
            description: "진부함을 탈피한 신선한 스토리 구성법을 배워보자 플롯의 마법: 기승전결을 넘어서는 이야기 구조를 배우는 시간,전통적 스토리 구조 vs. 웹소설형 구조 2) 3막·5막 구조 영화나 장편소설의 전형 → 웹소설은 매 화마다 미니 클라이맥스 3) 다층적 플롯(메인+서브 플롯) 구성 4)로맨스 + 서스펜스, 판타지 + 성장 드라마 등 장르 믹스 활용... 본문 생략",
            description_en: "",
        },
        {
            id: 4,
            title: "4강 생생한 캐릭터 창조하기",
            title_en: "Create Vivid Characters",
            subtitle: "독자의 마음을 훔치는 인물 만들기",
            subtitle_en: "Create characters that steal readers' hearts",
            author: "",
            coverColor: "#b27b56",
            textColor: "#fff",
            coverImage: "/writing-class/images/bookcover/book4.svg",
            description: "평면적인 캐릭터는 가라! 입체적이고 매력적인 인물 창조의 비결 “독자의 마음을 훔치는 인물 만들기” 평면적인 캐릭터는 독자의 기억에서 빠르게 사라집니다. 진정으로 기억에 남는 이야기는 입체적이고 매력적인 주인공이 이끌어 갑니다. 그렇다면 어떻게 이런 캐릭터를 창조할 수 있을까요?... 본문 생략",
            description_en: "",
        },
        {
            id: 5,
            title: "5강 첫 문장에서 마지막 문장까지",
            title_en: "From the First Sentence to the Last",
            subtitle: "첫 문장으로 독자를 사로잡아라, 강렬한 도입부 작성의 기술",
            subtitle_en: "Write a gripping first sentence to captivate your readers",
            author: "",
            coverColor: "#2a7e44",
            textColor: "#fff",
            coverImage: "/writing-class/images/bookcover/book5.svg",
            description: "독자의 시선을 사로잡는 웹소설 오프닝 기법 – 웹소설을 쓰는 작가라면 반드시 기억해야 할 문장이 있습니다. ‘첫 문장이 모든 것을 결정한다’는 것. 현대 독자는 참을성이 없습니다. 그들이 당신의 글을 선택할 시간은, 고작 몇 초. 그렇다고 오프닝은 ‘낚시’라는뜻은 아닙니다... 본문 생략",
            description_en: "",
        },
        {
            id: 6,
            title: "6강 완성도를 높이는 수정과 편집의 예술",
            title_en: "The Art of Editing and Revising to Elevate Your Work",
            subtitle: "퇴고로 작품에 생명을 불어넣다, 효과적인 수정과 편집 방법",
            subtitle_en: "Revise your work to give it life, and learn effective editing techniques",
            author: "",
            coverColor: "#f5f5f7",
            coverImage: "/writing-class/images/bookcover/book6.svg",
            description: "자기 점검과 피드백 활용법을 배워봅니다. - 자신의 글을 객관적으로 평가하고 개선하는 방법, 문장 다듬기의 기술이란?  오탈자·번역체 수정, 자동 교정툴 + 직접 낭독하며 어색한 부분 확인... 본문 생략",
            description_en: "",
        },
        {
            id: 7,
            title: "7강 작가로서의 길",
            title_en: "The Path to Becoming a Writer",
            subtitle: "출판과 마케팅 전략",
            subtitle_en: "Publishing and marketing strategies",
            author: "Lewis Carroll",
            coverColor: "#5abedf",
            textColor: "#fff",
            coverImage: "/writing-class/images/bookcover/book7.svg",
            description: "작가도 마케터다!: - 효과적인 자기 홍보와 브랜드 구축 방법 소개, 최적의 플랫폼 선택과 투고 전략, “왓패드, 웹노블 등 주요 플랫폼의 특징과 활용법”을 배워보자.... 본문 생략",
            description_en: "",
        },
    ]

    return (
        <ScrollArea className="w-full max-w-7xl mx-auto whitespace-wrap rounded-md">
            <div className=" flex space-x-6 pb-6">
                {books.map((book) => (
                    // Add onClick to trigger setting the selected book
                    <div key={book.id} onClick={() => setSelectedBook(book)}>
                        <BookCover book={book} />
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
            {/* Render ONE Dialog conditionally, outside the map */}
            <Dialog open={!!selectedBook} onOpenChange={(isOpen) => !isOpen && setSelectedBook(null)}>
               <BookDetailDialog selectedBook={selectedBook} setSelectedBook={setSelectedBook} language={language} />
            </Dialog>
        </ScrollArea >
    )
}

function BookCover({ book }: { book: CourseBook }) {
    const { language } = useLanguage();
    return (
        <div className="shrink-0 cursor-pointer transition-transform hover:scale-105">
            <div
                className="w-[180px] h-[240px] rounded-md flex flex-col justify-between p-4 relative overflow-hidden"
                style={{
                    backgroundColor: book.coverColor,
                    color: book.textColor || "#000",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
            >
                {/* {book.coverImage ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full flex flex-col justify-between p-4 z-10">
                            <div>
                                <h3 className="font-bold text-lg">{book.title}</h3>              
                            </div>
                        </div>
                        <Image
                            src={book.coverImage || "/placeholder.svg?height=240&width=160"}
                            alt={book.title}
                            fill
                            className="object-cover z-0"
                        />
                    </div>
                ) : ( */}
                <div key={book.id}>
                    <div>
                        <h3 className="font-bold text-lg">{language === "en" ? book.title_en : book.title}</h3>
                    </div>
                    <div className="absolute bottom-4 right-4 text-black opacity-70 break-keep">
                        <h4 className="text-right text-sm break-keep">{language === "en" ? book.subtitle_en : book.subtitle}</h4>
                    </div>
                    {book.id === 2 && (
                        <div className="absolute bottom-0 right-0">
                            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="50" fill="white" fillOpacity="0.3" />
                            </svg>
                        </div>
                    )}
                    {book.id === 5 && (
                        <div className="absolute bottom-0 right-0">
                            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="30" cy="30" r="30" fill="white" fillOpacity="0.3" />
                            </svg>
                            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.3" />
                            </svg>
                        </div>
                    )}
                </div>
                {/* )} */}
            </div>
        </div>
    )
}
