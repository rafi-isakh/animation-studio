'use client'
import { useEffect } from "react";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarShortcut } from "@/components/shadcnUI/Menubar";
import { List, Loader2 } from "lucide-react";
import { Chapter, Dictionary, Webnovel } from "@/components/Types";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const TableOfContents = ({ purchased_webnovel_chapters, language, chapter_id, setChapterToPurchase, setShowPurchaseModal, webnovel, isPurchasedChapter, phrase, dictionary, sortToggle }: { purchased_webnovel_chapters: number[], language: string, chapter_id: string, setChapterToPurchase: (chapter: Chapter) => void, setShowPurchaseModal: (show: boolean) => void, webnovel: Webnovel, isPurchasedChapter: (purchased_webnovel_chapters: number[], chapter_id: number, language: string) => boolean, phrase: (dictionary: Dictionary, key: string, language: string) => string, dictionary: Dictionary, sortToggle?: boolean }) => {
    const { toast } = useToast();
    const router = useRouter();
    const { data: chapterList, isLoading: isLoadingChapterList } = useSWR(`/api/get_chapter_list_by_webnovel_id?webnovel_id=${webnovel.id}`, fetcher);

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

    if (isLoadingChapterList) {
        return <div className="flex flex-row items-center justify-center h-full w-full"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <MenubarMenu >
            <MenubarTrigger className="rounded-sm p-1 data-[state=open]:bg-white dark:data-[state=open]:bg-[#211F21] cursor-pointer">
                <List className="h-5 w-5" />
                <span className="sr-only">{phrase(dictionary, "tableOfContents", language)}</span>
            </MenubarTrigger>
            <MenubarContent align="center" className="max-h-[60vh] overflow-y-auto  border-none">
                <MenubarItem className="font-semibold" inset>
                    {phrase(dictionary, "tableOfContents", language)}
                </MenubarItem>
                <MenubarSeparator />
                {chapterList?.map((chapter: Chapter, index: number) => (
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

                        {language === 'en' && 'Episode'} {index + 1} {language === 'ko' && '화'}{language === 'ja' && '話'}
                        <MenubarShortcut className="flex flex-row items-center justify-start">
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