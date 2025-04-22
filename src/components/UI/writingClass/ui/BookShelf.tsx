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
            coverImage: "/images/bookcover/book1.svg",
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
            coverImage: "/images/bookcover/book2.svg",
        },
        {
            id: 3,
            title: "3강 독자를 사로잡는 스토리텔링의 기술",
            title_en: "The Art of Storytelling that Captures Readers",
            subtitle: "클리셰를 깨부수고 신화를 창조하기",
            subtitle_en: "Break the clichés and create myths",
            author: "",
            coverColor: "#f5f5f7",
            coverImage: "/images/bookcover/book3.svg",
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
            coverImage: "/images/bookcover/book4.svg",
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
            coverImage: "/images/bookcover/book5.svg",
        },
        {
            id: 6,
            title: "6강 완성도를 높이는 수정과 편집의 예술",
            title_en: "The Art of Editing and Revising to Elevate Your Work",
            subtitle: "퇴고로 작품에 생명을 불어넣다, 효과적인 수정과 편집 방법",
            subtitle_en: "Revise your work to give it life, and learn effective editing techniques",
            author: "",
            coverColor: "#f5f5f7",
            coverImage: "/images/bookcover/book6.svg",
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
            coverImage: "/images/bookcover/book7.svg",
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
               <BookDetailDialog selectedBook={selectedBook} setSelectedBook={setSelectedBook} />
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
