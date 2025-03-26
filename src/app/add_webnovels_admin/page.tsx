"use client"

import { parseEpub } from '@gxl/epub-parser'
import { useState } from 'react';
import { parseHtmlToText } from '@/utils/stringUtils';
import { Button, Checkbox, LinearProgress, TextField } from '@mui/material';
import { parseOfficeAsync } from "officeparser";

export default function UploadWebnovelsAdmin() {
    const [userEmail, setUserEmail] = useState<string>("");
    const [authorEmail, setAuthorEmail] = useState<string>("");
    const [authorNickname, setAuthorNickname] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [genre, setGenre] = useState<string>("bl");
    const [language, setLanguage] = useState<string>("ko");
    const [picture, setPicture] = useState<File | null>(null);
    const [webnovelId, setWebnovelId] = useState<string>("");
    const [publisherKoreanName, setPublisherKoreanName] = useState<string>("");
    const [publisherEnglishName, setPublisherEnglishName] = useState<string>("");
    const [publisherEmail, setPublisherEmail] = useState<string>("");
    const [numberOfFreeChapters, setNumberOfFreeChapters] = useState<number>(0);
    const [chapterFiles, setChapterFiles] = useState<File[]>([]);
    const [chapterEpubObjs, setChapterEpubObjs] = useState<any[]>([]);
    const [chapterDocxObjs, setChapterDocxObjs] = useState<any[]>([]);
    const [chapterTxtObjs, setChapterTxtObjs] = useState<any[]>([]);
    const [tags, setTags] = useState<string>("");
    const [webnovelTitle, setWebnovelTitle] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [userIsAuthor, setUserIsAuthor] = useState<boolean>(false);
    const [priceKorean, setPriceKorean] = useState<number>(10);
    const [priceEnglish, setPriceEnglish] = useState<number>(30);
    const [availableLanguages, setAvailableLanguages] = useState<string[]>(["ko"]);
    const [fileType, setFileType] = useState<'epub' | 'docx' | 'txt'>("epub");
    const [okayToCreateVideos, setOkayToCreateVideos] = useState<boolean>(false);
    const [titleEnglish, setTitleEnglish] = useState<string>("");
    const [filesLoaded, setFilesLoaded] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);

    const parseTxt = async (file: File) => {
        // Read the text content from the file
        const text = await file.text();

        // Extract title from filename (remove extension)
        let title = file.name.replace(/\.txt$/, '').replace("_", " ")

        return {
            text,
            title
        };
    }

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPicture(file);
        }
    }

    const handleAddWebnovel = async () => {
        const title = webnovelTitle;
        const formData = new FormData();
        formData.append('title', title!);
        formData.append('title_english', titleEnglish);
        formData.append('description', description);
        formData.append('genre', genre);
        formData.append('language', language);
        formData.append('cover_art', picture!);
        formData.append('user_email', userEmail); // publisher email
        formData.append('user_nickname', publisherKoreanName!);
        formData.append('publisher_english_name', publisherEnglishName);
        formData.append('publisher_korean_name', publisherKoreanName);
        formData.append('publisher_email', publisherEmail);
        formData.append('num_free_chapters', numberOfFreeChapters.toString());
        formData.append('tags', tags);
        formData.append('user_is_author', userIsAuthor.toString());
        formData.append('author_email', authorEmail); // might not be an actual email
        formData.append('author_nickname', authorNickname);
        formData.append("available_languages", JSON.stringify(availableLanguages));
        formData.append("price_korean", priceKorean.toString());
        formData.append("price_english", priceEnglish.toString());
        formData.append("okay_to_create_videos", okayToCreateVideos.toString());

        const response = await fetch('/api/add_webnovel_admin', {
            method: 'POST',
            body: formData,
        })
        if (!response.ok) {
            alert("Failed to add webnovel");
            return;
        }
        const data = await response.json();
        setWebnovelId(data.id);
        console.log(data);
        alert(`Webnovel ${title} added successfully`);
    }

    const handleChapterFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilesLoaded(false);
        const files = Array.from(e.target.files ?? []);
        console.log(files);
        if (files) {
            setChapterFiles([...chapterFiles, ...Array.from(files)]);
        }
        if (files[0].name.endsWith("epub")) {
            const newChapterEpubObjs: any[] = [];
            for (const file of files ?? []) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const epubObj = await parseEpub(buffer, {
                    type: 'buffer',
                })
                console.log(epubObj);
                newChapterEpubObjs.push(epubObj);
            }
            setChapterEpubObjs(newChapterEpubObjs);
            setFileType("epub");
        } else if (files[0].name.endsWith("docx")) {
            const newChapterDocxObjs: any[] = [];
            for (const file of files ?? []) {
                const buffer = Buffer.from(await file.arrayBuffer());
                console.log('file.name', file.name);
                const docxObj = await parseOfficeAsync(buffer);
                console.log(docxObj);
                newChapterDocxObjs.push(docxObj);
            }
            setChapterDocxObjs(newChapterDocxObjs);
            setFileType("docx");
        } else if (files[0].name.endsWith("txt")) {
            const newChapterTxtObjs: any[] = [];
            for (const file of files ?? []) {
                const txtObj = await parseTxt(file);
                console.log(txtObj);
                newChapterTxtObjs.push(txtObj);
            }
            setChapterTxtObjs(newChapterTxtObjs);
            setFileType("txt");
        }
        alert("Files loaded")
        setFilesLoaded(true);
    }
    const handleAddChapter = async () => {
        let maxProgress = 0;
        if (fileType === "epub") {
            maxProgress = chapterEpubObjs.length;
        } else if (fileType === "docx") {
            maxProgress = chapterDocxObjs.length;
        } else if (fileType === "txt") {
            maxProgress = chapterTxtObjs.length;
        }

        let progressCount = 0;

        const chapters = []
        let text;
        let title;
        if (fileType === "epub") {
            for (let i = 0; i < chapterEpubObjs.length; i++) {
                const epubObj = chapterEpubObjs[i];
                let htmlString = "";
                for (const section of epubObj.sections) {
                    if (section.id.startsWith('Section')) {
                        htmlString += section.htmlString;
                    }
                }
                text = parseHtmlToText(htmlString!);
                title = epubObj.info?.title;
                if (!title) {
                    title = `${webnovelTitle} ${i + 1}화`;
                }
                const chapter = { title: "", content: "", webnovel_id: webnovelId }
                chapter.title = title;
                chapter.content = text;
                chapter.webnovel_id = webnovelId;
                chapters.push(chapter);
            }
        } else if (fileType === "docx") {
            for (const docxObj of chapterDocxObjs) {
                text = docxObj.text;
                title = docxObj.title;
                const chapter = { title: "", content: "", webnovel_id: webnovelId }
                chapter.title = title;
                chapter.content = text;
                chapter.webnovel_id = webnovelId;
                chapters.push(chapter);
            }
        } else if (fileType === "txt") {
            for (const txtObj of chapterTxtObjs) {
                text = txtObj.text;
                title = txtObj.title;
                const chapter = { title: "", content: "", webnovel_id: webnovelId }
                chapter.title = title;
                chapter.content = text;
                chapter.webnovel_id = webnovelId;
                chapters.push(chapter);
            }
        }
        await addAllChapters(chapters);
        alert("All chapters added successfully");
    }

    const addAllChapters = async (chapters: { title: string, content: string, webnovel_id: string }[]) => {
        setUploading(true);
        const response = await fetch('/api/add_chapters_admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chapters: chapters,
            }),
        });
        if (!response.ok) {
            throw new Error("Failed to add chapters");
        }
        setUploading(false);
        return response.json();
    }

    const addSingleChapter = async (title: string, text: string) => {
        const response = await fetch('/api/add_chapter_admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                webnovel_id: webnovelId,
                title: title || "Unnamed Chapter",
                content: text || "",
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to add chapter");
        }

        return response.json();
    }

    return <div className="flex flex-col space-y-4 items-center justify-center max-w-screen-md p-4 mx-auto mb-24">
        <TextField className='w-[50%]' label="User (Not Author) Email" type="text" value={userEmail || ""} onChange={(e) => setUserEmail(e.target.value)} />
        <TextField className='w-[50%]' label="Author Email" type="text" value={authorEmail || ""} onChange={(e) => setAuthorEmail(e.target.value)} />
        <TextField className='w-[50%]' label="Author Nickname" type="text" value={authorNickname || ""} onChange={(e) => setAuthorNickname(e.target.value)} />
        <div className='flex flex-row space-x-4 items-center'>
            <p>User is Author</p>
            <Checkbox checked={userIsAuthor} onClick={() => setUserIsAuthor(!userIsAuthor)} />
        </div>
        <div className='flex flex-row space-x-4 items-center'>
            <p>Available in Korean</p>
            <Checkbox checked={availableLanguages.includes("ko")} onClick={() => setAvailableLanguages(availableLanguages.includes("ko") ? availableLanguages.filter(lang => lang !== "ko") : [...availableLanguages, "ko"])} />
        </div>
        <div className='flex flex-row space-x-4 items-center'>
            <p>Available in English</p>
            <Checkbox checked={availableLanguages.includes("en")} onClick={() => setAvailableLanguages(availableLanguages.includes("en") ? availableLanguages.filter(lang => lang !== "en") : [...availableLanguages, "en"])} />
        </div>
        <TextField
            className='w-full'
            label="Description"
            multiline
            rows={4}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
        <TextField label="Genre" type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
        <TextField label="Language" type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
        <div className='flex flex-row space-x-4'>
            <p>Cover Art</p>
            <input type="file" accept="image/*" onChange={handlePictureChange} />
        </div>
        <TextField className='w-[50%]' label="Webnovel Title" type="text" value={webnovelTitle} onChange={(e) => setWebnovelTitle(e.target.value)} />
        <TextField className='w-[50%]' label="Webnovel Title English" type="text" value={titleEnglish} onChange={(e) => setTitleEnglish(e.target.value)} />
        <TextField className='w-[50%]' label="Number of Free Chapters" type="text" value={numberOfFreeChapters} onChange={(e) => setNumberOfFreeChapters(Number(e.target.value))} />
        <TextField className='w-[50%]' label="Publisher English Name" type="text" value={publisherEnglishName} onChange={(e) => setPublisherEnglishName(e.target.value)} />
        <TextField className='w-[50%]' label="Publisher Korean Name" type="text" value={publisherKoreanName} onChange={(e) => setPublisherKoreanName(e.target.value)} />
        <TextField className='w-[50%]' label="Publisher Email" type="text" value={publisherEmail} onChange={(e) => setPublisherEmail(e.target.value)} />
        <TextField className='w-[50%]' label="Tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        <TextField className='w-[50%]' label="Price (Korean)" type="text" value={priceKorean} onChange={(e) => setPriceKorean(Number(e.target.value))} />
        <TextField className='w-[50%]' label="Price (English)" type="text" value={priceEnglish} onChange={(e) => setPriceEnglish(Number(e.target.value))} />
        <div className='flex flex-row space-x-4 items-center'>
            <p>Okay to Create Videos</p>
            <Checkbox checked={okayToCreateVideos} onClick={() => setOkayToCreateVideos(!okayToCreateVideos)} />
        </div>
        <Button color='gray' variant='contained' onClick={handleAddWebnovel}>Add Webnovel</Button>
        <TextField className='w-[50%]' label="Webnovel ID" type="text" value={webnovelId || ""} onChange={(e) => setWebnovelId(e.target.value)} />
        <div className='flex flex-row space-x-4'>
            <p>Chapter Files</p>
            <input type="file" multiple accept=".epub,.docx,.txt" onChange={handleChapterFilesChange} />
        </div>
        <div className="py-4"></div>
        <Button color='gray' variant='contained' onClick={handleAddChapter} disabled={!filesLoaded || uploading}>Add Chapters</Button>
        <LinearProgress value={progress} />
    </div>
}