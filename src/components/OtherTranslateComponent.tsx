"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { ElementType, ElementSubtype, Language, ToonyzPost, Webnovel, Chapter, Comment, OtherTranslation, SlickCarouselItem, UserStripped } from '@/components/Types';
import { CircularProgress, Skeleton } from '@mui/material';
import { replaceSmartQuotes } from '@/utils/font';
import { marked } from 'marked';
import { useTheme } from '@/contexts/providers';
const OtherTranslateComponent = ({
    element,
    content,
    elementId,
    elementType,
    elementSubtype,
    defaultLanguage,
    classParams = "",
    showLoading = true,
    incomingText = '',
}: {
    element: Webnovel | Chapter | UserStripped | ToonyzPost | SlickCarouselItem | Comment,
    content: string,
    elementId: string,
    elementType: ElementType,
    elementSubtype?: ElementSubtype,
    defaultLanguage?: Language,
    classParams?: string,
    showLoading?: boolean,
    incomingText?: string
}) => {
    const [text, setText] = useState(incomingText);
    const [processedText, setProcessedText] = useState<string>(incomingText);
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const [loading, setLoading] = useState(false)
    const languageChangedRef = useRef(false);
    const [skeletonHeight, setSkeletonHeight] = useState<number | null>(null);
    const [skeletonWidth, setSkeletonWidth] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (contentRef.current) {
            setSkeletonHeight(contentRef.current.offsetHeight);
            setSkeletonWidth(contentRef.current.offsetWidth);
        }
    }, [content, classParams]);

    useEffect(() => {
        const capitalizeEachWord = (str: string) => {
            return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        if (elementType == "webnovel" && elementSubtype == "title") {
            let processedText = text.replaceAll(".", ""); // titles can sometimes look like "The title."; change these to "The Title"
            processedText = capitalizeEachWord(processedText);
            setProcessedText(processedText);
        }
        else {
            setProcessedText(text);
        }
    }, [text, language]);


    useEffect(() => {
        // if the translation was already returned in the element, use it
        const translation = element.other_translations?.find(
            (translation: OtherTranslation) =>
                translation.language == language
                && translation.element_type == elementType
                && translation.element_subtype == elementSubtype
                && (translation.webnovel_id == elementId
                    || translation.chapter_id == elementId
                    || translation.user_id == elementId
                    || translation.comment_id == elementId
                    || translation.carousel_item_id == elementId
                    || translation.post_id == elementId));

        if (translation) {
            setText(translation.text);
            return
        }
        const sessionKey = `${elementType}.${elementId}.${language}.${elementSubtype}`;
        languageChangedRef.current = true;
        const detectLanguage = () => {
            // Check if content is Korean or Japanese by looking for Korean/Japanese characters
            const koreanRegex = /[\u3131-\u314E\u314F-\u3163\uAC00-\uD7A3]/;
            const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
            const isKorean = koreanRegex.test(content);
            const isJapanese = japaneseRegex.test(content);
            // Check if content is English by looking for non-English characters
            const nonEnglishRegex = /[^\x00-\x7F]/;
            const isEnglish = !nonEnglishRegex.test(content);
            if (isEnglish && language === 'en'
                || isKorean && language === 'ko'
                || isJapanese && language === 'ja'
            ) {
                return true;
            }
            return false;
        }

        const handleTranslate = async () => {
            const originalAndTargetLangSame = detectLanguage();
            if (originalAndTargetLangSame) {
                setText(content);
                return
            }
            // elmeentId is either chapter.id (for chapter title) or webnovel.id (for webnovel title and description) or user_id (for user bio)
            const sessionData = localStorage.getItem(sessionKey)
            if (sessionData) {
                setText(sessionData)
                return
            }
            else {
                setLoading(true)
                const response = await fetch(`/api/get_other_translation?element_type=${elementType}&element_id=${elementId}&language=${language}&element_subtype=${elementSubtype}`)
                const data = await response.json();
                if (data.text) {
                    setText(data.text);
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
                    setLoading(false);
                    languageChangedRef.current = false;
                }
            } else {
                setText(content);
                setLoading(false);
                languageChangedRef.current = false;
            }
        }
        initiate();
    }, [language, content]);


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

            const res = await fetch('/api/save_other_translation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                console.error("Saving translation to DB failed", errorData.error);
            } else {
                console.log("Translation saved to DB");
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
        // do special handling in backend for webnovel title
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?target=${language}`);
        const data = await response.json();
        setText(data.translation);
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
                        <Skeleton sx={{ bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)' }} variant='rectangular' width={skeletonWidth || 100} height={skeletonHeight || 18} />
                    ) : <div className={`${classParams}`} dangerouslySetInnerHTML={{ __html: replaceSmartQuotes(processedText).replaceAll("\n", "<br/>") }} />
            }
        </div>
    );
};

export default OtherTranslateComponent;