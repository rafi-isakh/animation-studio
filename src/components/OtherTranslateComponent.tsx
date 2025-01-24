"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { ElementType, ElementSubtype, Language } from '@/components/Types';
import { CircularProgress, Skeleton } from '@mui/material';
import { replaceSmartQuotes } from '@/utils/font';
import { marked } from 'marked';

const OtherTranslateComponent = React.memo(({ content, elementId, elementType, elementSubtype, defaultLanguage, classParams = "", showLoading = true, incomingText = '', }:
    { content: string, elementId: string, elementType: ElementType, elementSubtype?: ElementSubtype, defaultLanguage?: Language, classParams?: string, showLoading?: boolean, incomingText?: string }) => {
    const [text, setText] = useState(incomingText);
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const fetchRef = useRef(false);
    const [finished, setFinished] = useState(false)
    const [changeCount, setChangeCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const languageChangedRef = useRef(false);
    const [skeletonHeight, setSkeletonHeight] = useState<number | null>(null);
    const [skeletonWidth, setSkeletonWidth] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [markedText, setMarkedText] = useState("");

    useEffect(() => {
        if (contentRef.current) {
            setSkeletonHeight(contentRef.current.offsetHeight);
            setSkeletonWidth(contentRef.current.offsetWidth);
        }
    }, [content, classParams]);

    useEffect(() => {
        languageChangedRef.current = true;
        setText("");
        setLoading(true);
        const detectLanguage = async () => {
            let originalAndTargetLangSame = false;
            const response = await fetch('/api/detect_language', {
                method: 'POST',
                body: JSON.stringify({ text: content }),
            });
            const data = await response.json();
            const langcode = data.langcode;
            if (langcode == language) {
                originalAndTargetLangSame = true;
            }
            return originalAndTargetLangSame;
        }

        const handleTranslate = async () => {
            const originalAndTargetLangSame = await detectLanguage();
            if (originalAndTargetLangSame) {
                setText(content);
                setMarkedText(await marked(content));
                setLoading(false);
                return;
            }
            // elmeentId is either chapter.id (for chapter title) or webnovel.id (for webnovel title and description) or user_id (for user bio)
            const sessionKey = `${elementType}.${elementId}.${language}.${elementSubtype}`;
            const subtypeOrNot = elementSubtype ? `&element_subtype=${elementSubtype}` : '';
            const sessionData = localStorage.getItem(sessionKey)
            if (sessionData) {
                setText(sessionData)
                setMarkedText(await marked(sessionData));
                setLoading(false)
            }
            else {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_other_translation?element_type=${elementType}&element_id=${elementId}&language=${language}${subtypeOrNot}`)
                const data = await response.json();
                if (data.text) {
                    setText(data.text);
                    setMarkedText(await marked(data.text));
                    setLoading(false)
                    localStorage.setItem(sessionKey, data.text)
                }

                // If there's no translation in the DB
                // initialized.current is bc useEffect runs twice
                // submitContent with ongoing translation
                if (!data.done && !initialized.current) {
                    submitContent(data.text);
                    initialized.current = true;
                }
            }
            languageChangedRef.current = false;
        }
        const initiate = async () => {
            if (defaultLanguage != language) {
                if (content) {
                    initialized.current = false;
                    handleTranslate();
                } else {
                    setText("");
                    setMarkedText("");
                    setLoading(false);
                    languageChangedRef.current = false;
                }
            } else {
                setText(content);
                setMarkedText(await marked(content));
                setLoading(false);
                languageChangedRef.current = false;
            }
        }
        initiate();
    }, [language, elementType, elementId, elementSubtype]);

    useEffect(() => {
        setChangeCount((prevCount) => prevCount + 1);
    }, [text]);

    const saveTranslationToDB = async (translation: string, done: boolean) => {
        if (translation) {
            const data = {
                "text": translation,
                "language": language,
                "element_id": elementId,
                "element_type": elementType,
                "element_subtype": elementSubtype || null,
                "done": done
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/save_other_translation`, {
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
        const data = {
            "original": content,
            "translation": translation
        }
        try {
            const response = await fetch(`/api/send_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                const data = await response.json();
                startTranslation(data.text_id);
            } else {
                console.error('Failed to submit words');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const startTranslation = async (textId: string) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?target=${language}`);
        const data = await response.json();
        setText(data.translation);
        setMarkedText(await marked(data.translation));
        saveTranslationToDB(data.translation, true);
        setLoading(false);
    };

    type Direction = 'ltr' | 'rtl';

    return (
        <div style={{ direction: `${isRtl}` as Direction }}>
            <div ref={contentRef} className={`${classParams}`} style={{ visibility: 'hidden', position: 'absolute', zIndex: -1 }}>
                {content}
            </div>
            {
                loading && showLoading ?
                    (
                        <Skeleton variant='rectangular' width={skeletonWidth || 100} height={skeletonHeight || 18} />
                    ) : <div className={`${classParams}`} dangerouslySetInnerHTML={{ __html: replaceSmartQuotes(text).replaceAll("\n", "<br/>") }} />
            }
        </div>
    );
});

OtherTranslateComponent.displayName = 'OtherTranslateComponent'; // need this because this is a React.memo
export default OtherTranslateComponent;