"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import { replaceSmartQuotes } from '@/utils/font';
import React, { useState, useEffect, useRef } from 'react';

const WebnovelTranslateComponent = ({ content, chapterId }: { content: string, chapterId: string }) => {
    const [text, setText] = useState('');
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const fetchRef = useRef(false);
    const [finished, setFinished] = useState(false)
    const [changeCount, setChangeCount] = useState(0)

    useEffect(() => {
        if (fetchRef.current) return;
        fetchRef.current = true;

        const handleTranslate = async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_translation?chapter_id=${chapterId}&language=${language}`)
            const data = await response.json();
            if (data.text) {
                setText(data.text)
            }

            // If there's no translation in the DB
            // initialized.current is bc useEffect runs twice
            // submitContent with ongoing translation
            if (!data.done && !initialized.current) {
                submitContent(data.text);
                initialized.current = true;
            }
        }
        handleTranslate();
    }, []);

    useEffect(() => {
        setChangeCount((prevCount) => prevCount + 1);
    }, [text]);

    useEffect(() => {
        // save every 200 tokens
        if (changeCount > 200) {
            if (!finished && initialized.current) {
                saveTranslationToDB(false);
            }
            setChangeCount(0);
        }
    })

    useEffect(() => {
        if (initialized.current) {
            saveTranslationToDB(true);
        }
    }, [finished])

    const saveTranslationToDB = async (done: boolean) => {
        if (text) {
            const data = {
                "text": text,
                "language": language,
                "chapter_id": chapterId,
                "done": done
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/save_translation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                console.error("Saving translation to DB failed");
            } else {
            }
        }
    }

    const submitContent = async (translation: string) => {
        if (!translation) translation = "";
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/send_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'original': content,
                    'translation': translation
                })
            });

            if (response.ok) {
                const data = await response.json();
                startEventSource(data.text_id);
            } else {
                console.error('Failed to submit words');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const startEventSource = (textId: string, cvid: string = '', to_continue: number = 0) => {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?target=${language}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.ended == 0) {
                setText(text => text + data.token);
            } else if (data.ended == 1) {
                setFinished(true);
            } else if (data.ended == -1) { // continue case
                eventSource.close();
                startEventSource(textId, data.cvid, 1);
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
        };
        return () => {
            eventSource.close();
        };
    };

    type Direction = 'ltr' | 'rtl';

    return (
        <div dangerouslySetInnerHTML={{ __html: replaceSmartQuotes(text) }} style={{ whiteSpace: 'pre-wrap', direction: `${isRtl}` as Direction }}>
        </div>
    );
};

export default WebnovelTranslateComponent;