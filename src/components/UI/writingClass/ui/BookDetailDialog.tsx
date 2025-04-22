import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/shadcnUI/Dialog"
import { ScrollArea } from "@/components/shadcnUI/ScrollArea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/shadcnUI/Button";
import Image from "next/image";
import { CourseBook } from "@/components/Types";

interface BookDetailDialogProps {
    selectedBook: CourseBook | null;
    setSelectedBook: (book: CourseBook | null) => void;
}

export default function BookDetailDialog({ selectedBook, setSelectedBook }: BookDetailDialogProps) {
    if (!selectedBook) return null;
    const { language } = useLanguage();
    return (
        <DialogContent className="bg-white md:h-[95vh] h-full">
            <DialogHeader>
                <DialogTitle>{language === "en" ? "View details" : "살펴 보기"}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-full">
                <div className="flex flex-col items-center justify-between gap-4">
                    <Image
                        src={selectedBook.coverImage || "/placeholder.svg?height=240&width=160"}
                        alt={selectedBook.title}
                        width={160}
                        height={240}
                        className="object-cover z-0 rounded-xl" />
                    <h1 className="text-2xl font-bold">{language === "en" ? selectedBook.title_en : selectedBook.title}</h1>
                    <p className="text-sm opacity-80">{language === "en" ? selectedBook.subtitle_en : selectedBook.subtitle}</p>
                    <DialogDescription>
                        <span className="text-sm opacity-80">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus provident fuga officiis distinctio quam assumenda perferendis? Deleniti voluptatibus harum et in possimus qui vitae, eum consequatur ad minima non debitis!
                           Lorem ipsum dolor sit, amet consectetur adipisicing elit. Reprehenderit facilis, expedita natus quia ullam exercitationem eius eligendi asperiores odit nemo placeat. Nulla debitis ipsa sapiente. Accusamus minus obcaecati animi officia.
                           Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptates expedita veniam similique temporibus et quisquam ex, porro magnam vero amet natus eligendi dolor soluta iusto fuga voluptas rerum. Perspiciatis, iste?
                           Lorem ipsum dolor sit amet consectetur, adipisicing elit. Consequatur praesentium magni suscipit odio fugit odit. Aliquid quod tempore possimus, pariatur eius dignissimos cumque porro quas vero accusantium nobis natus blanditiis.
                        </span>
                    </DialogDescription>
                </div>
            </ScrollArea>
            <DialogFooter className="flex flex-row gap-2 !justify-center !items-center">
                <Button 
                 variant="outline"
                 onClick={() => setSelectedBook(null)} 
                 className="bg-black hover:bg-black/40 text-white font-semibold px-8 py-6 text-lg cursor-pointer">
                    {language === "en" ? "Close" : "닫기"}
                </Button>
                <Button variant="outline" className="bg-[#DE2B74] hover:bg-[#DE2B74]/40 text-white font-semibold px-8 py-6 text-lg cursor-pointer">
                    {language === "en" ? "Buy Now" : "구매하기"}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}