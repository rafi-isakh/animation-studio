"use client"

import { Button } from "@mui/material";
import { Chapter, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";

export async function TranslateWebnovelAllButton({webnovel}: {webnovel: Webnovel}) {

    const {language} = useLanguage();

    const submitContent = async (content: string, chapterId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/send_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'original': content,
                    'translation': "" // deprecated because I dont have to worry about stopped mid-translating
                })
            });

            if (response.ok) {
                const data = await response.json();
                await startTranslation(data.text_id, chapterId);
            } else {
                console.error('Failed to submit words');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const startTranslation = async (textId: string, chapterId: number) => {
        const webnovelId = webnovel.id
        const sourceLanguage = webnovel.language
        if (sourceLanguage === language) {
            return;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?source=${sourceLanguage}&target=${language}&webnovel_id=${webnovelId}&chapter_id=${chapterId}`);
        if (!response.ok) {
            alert(`Translation failed for chapter ${chapterId}`)
        }
    };


    async function handleTranslateAll() {
        const sorted = JSON.parse(JSON.stringify(webnovel as unknown as string)).chapters.sort((a: Chapter, b: Chapter) => a.id - b.id)
        for (const chapter of sorted) {
            const startTime = new Date()
            console.log("Started translation at ", startTime)
            await submitContent(chapter.content, chapter.id)
            const endTime = new Date()
            console.log("Ended translation at ", endTime)
            console.log("Time taken: ", (endTime.getTime() - startTime.getTime()) / 1000, " seconds")
        }
    }

    return <Button onClick={handleTranslateAll} variant="outlined" color="gray">Translate All</Button>
}
