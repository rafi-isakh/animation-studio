import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/shadcnUI/Dialog"
import { ScrollArea } from "@/components/shadcnUI/ScrollArea";
// import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/shadcnUI/Button";
import Image from "next/image";
import { CourseBook } from "@/components/Types";

interface BookDetailDialogProps {
    selectedBook: CourseBook | null;
    setSelectedBook: (book: CourseBook | null) => void;
    language: string;
}

export default function BookDetailDialog({ selectedBook, setSelectedBook, language }: BookDetailDialogProps) {
    if (!selectedBook) return null;

    return (
        <DialogContent className="bg-white md:h-[95vh] lg:h-[60vh] h-full" showCloseButton={true}>
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
                          {language === "en" ? selectedBook.description_en : selectedBook.description}
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
                    {language === "en" ? "Download" : "다운받기"}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}