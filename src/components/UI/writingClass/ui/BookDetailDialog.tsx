import { DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/shadcnUI/Dialog"
import { ScrollArea } from "@/components/shadcnUI/ScrollArea";
import Link from "next/link";
import { Button } from "@/components/shadcnUI/Button";
import Image from "next/image";
import { CourseBook } from "@/components/Types";
import PDFviewButton from "@/components/UI/writingClass/ui/PDFviewButton";

interface BookDetailDialogProps {
    selectedBook: CourseBook | null;
    setSelectedBook: (book: CourseBook | null) => void;
    language: string;
    isLoggedIn: boolean;
}

export default function BookDetailDialog({ selectedBook, setSelectedBook, language, isLoggedIn }: BookDetailDialogProps) {
    if (!selectedBook) return null;

    return (
        <DialogContent className="bg-white sm:h-[95vh] md:h-[70vh] lg:h-[70vh] xl:h-[70vh] h-full" showCloseButton={true}>
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
                    <PDFviewButton
                        mode="modal"
                        language={language}
                        title={language === "en" ? "Download" : "무료로 다운받기"}
                        file_url_en={selectedBook.file_url_en || ""}
                        file_url_ko={selectedBook.file_url_ko || ""}
                        isLoggedIn={isLoggedIn === null ? undefined : isLoggedIn}
                    />
            </DialogFooter>
        </DialogContent>
    )
}