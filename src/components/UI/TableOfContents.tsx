import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarShortcut } from "@/components/shadcnUI/Menubar";
import { List } from "lucide-react";
import { Chapter, Dictionary, Webnovel } from "@/components/Types";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const TableOfContents = ({ sortedChapters, purchased_webnovel_chapters, language, chapter_id, setChapterToPurchase, setShowPurchaseModal, webnovel, isPurchasedChapter, phrase, dictionary }: { sortedChapters: Chapter[], purchased_webnovel_chapters: number[], language: string, chapter_id: string, setChapterToPurchase: (chapter: Chapter) => void, setShowPurchaseModal: (show: boolean) => void, webnovel: Webnovel, isPurchasedChapter: (purchased_webnovel_chapters: number[], chapter_id: number, language: string) => boolean, phrase: (dictionary: Dictionary, key: string, language: string) => string, dictionary: Dictionary }) => {
    const { toast } = useToast();
    const router = useRouter();

    const handleChapterClick = (chapter: Chapter) => {
        if (!webnovel?.available_languages.includes(language)) {
            toast({
                title: phrase(dictionary, "languageNotAvailable", language),
                description: "Please select a different language",
                variant: "destructive",
            });
            return;
        }
        if (chapter.free) {
            router.push(`/view_webnovels/${webnovel?.id}/chapter_view/${chapter.id}`);
        } else {
            if (isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language)) {
                router.push(`/view_webnovels/${webnovel?.id}/chapter_view/${chapter.id}`);
                return;
            }
            setChapterToPurchase(chapter);
            setShowPurchaseModal(true);
        }
    }
    
    
    return (
       
            <MenubarMenu>
                <MenubarTrigger className="rounded-sm p-2 data-[state=open]:bg-transparent bg-transparent cursor-pointer">
                    <List className="h-5 w-5" />
                    <span className="sr-only">{phrase(dictionary, "tableOfContents", language)}</span>
                </MenubarTrigger>
                <MenubarContent align="center" className="max-h-[60vh] overflow-y-auto ">
                    <MenubarItem className="font-semibold" inset>
                        {phrase(dictionary, "tableOfContents", language)}
                    </MenubarItem>
                    <MenubarSeparator />
                    {sortedChapters?.map((chapter, index) => (
                        <MenubarItem
                            key={chapter.id}
                            onClick={() => {
                                if (!chapter.free && !isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language)) {
                                    setChapterToPurchase(chapter);
                                    setShowPurchaseModal(true);
                                } else {
                                    handleChapterClick(chapter);
                                }
                            }}
                            className={`${chapter.id === Number(chapter_id) ? "bg-accent" : ""} ${!chapter.free && !isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language) ? "opacity-50" : ""}`}
                        // disabled={!chapter.free && !purchased_webnovel_chapters?.includes(chapter.id)}
                        >
                            <p className="text-sm">{index + 1}.</p>
                            <MenubarShortcut className="flex flex-row items-center justify-start">
                                {/* {chapter.title} */}
                                <OtherTranslateComponent
                                    element={chapter}
                                    content={chapter.title}
                                    elementId={chapter.id.toString()}
                                    elementType='chapter'
                                    elementSubtype="title"
                                    classParams="text-md mt-1 mb-1"
                                />
                                {!chapter.free && !isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language) && (
                                    <span className="ml-2">🔒</span>
                                )}
                            </MenubarShortcut>
                        </MenubarItem>
                    ))}
                </MenubarContent>
            </MenubarMenu>
     
    )
}

export default TableOfContents;