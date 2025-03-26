import { Button } from "@mui/material";
import { Chapter, Webnovel } from "@/components/Types";
import { useWebnovels } from "@/contexts/WebnovelsContext";
import { useEffect, useState } from "react";
export function TranslateWebnovelAllButton({language, webnovel}: {language: string, webnovel: Webnovel}) {

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
                console.log('data', data)
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
        const sorted = JSON.parse(JSON.stringify(webnovel)).chapters.sort((a: Chapter, b: Chapter) => a.id - b.id)
        const upTo = parseInt(prompt("Up to what chapter do you want to translate?") ?? "0") + 1
        const startFrom = parseInt(prompt("Start from which chapter?") ?? "0") + 1
        for (const chapter of sorted.slice(startFrom, upTo)) {
            const startTime = new Date()
            console.log("Started translation at ", startTime)
            if (chapter.content) {
                await submitContent(chapter.content, chapter.id)
            }
            const endTime = new Date()
            console.log("Ended translation at ", endTime)
            console.log("Time taken: ", (endTime.getTime() - startTime.getTime()) / 1000, " seconds")
        }
    }

    return <Button onClick={handleTranslateAll} variant="outlined" color="gray">Translate All</Button>
}
