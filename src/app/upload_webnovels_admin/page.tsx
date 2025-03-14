"use client"

import { parseEpub } from '@gxl/epub-parser'
import { useState } from 'react';
import { parseHtmlToText } from '@/utils/stringUtils';
import { Button, Checkbox, LinearProgress, TextField } from '@mui/material';
import { Input } from '@mui/material';

export default function UploadWebnovelsAdmin() {
    const [file, setFile] = useState<File | null>(null);
    const [user_email, setUserEmail] = useState<string>("");
    const [author_email, setAuthorEmail] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [genre, setGenre] = useState<string>("bl");
    const [language, setLanguage] = useState<string>("ko");
    const [picture, setPicture] = useState<File | null>(null);
    const [epubObj, setEpubObj] = useState<any>(null);
    const [webnovelId, setWebnovelId] = useState<string | null>(null);
    const [chapterTitle, setChapterTitle] = useState<string>("");
    const [publisherKoreanName, setPublisherKoreanName] = useState<string>("");
    const [publisherEnglishName, setPublisherEnglishName] = useState<string>("");
    const [publisherEmail, setPublisherEmail] = useState<string>("");
    const [numberOfFreeChapters, setNumberOfFreeChapters] = useState<number>(0);
    const [chapterFiles, setChapterFiles] = useState<File[]>([]);
    const [chapterEpubObjs, setChapterEpubObjs] = useState<any[]>([]);
    const [tags, setTags] = useState<string>("");
    const [webnovelTitle, setWebnovelTitle] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [userIsAuthor, setUserIsAuthor] = useState<boolean>(false);
    const [priceKorean, setPriceKorean] = useState<number>(10);
    const [priceEnglish, setPriceEnglish] = useState<number>(30);
    const [availableLanguages, setAvailableLanguages] = useState<string[]>(["ko"]);
    const handleChapterFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).sort((a, b) => {
            // Extract numbers from filenames and compare them numerically
            // const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
            // const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
            // return numA - numB;
            // Extract part number (부) and chapter number (화) from Korean-style chapter naming
            const partAMatch = a.name.match(/(\d+)부/);
            const partBMatch = b.name.match(/(\d+)부/);
            const chapterAMatch = a.name.match(/(\d+)화/);
            const chapterBMatch = b.name.match(/(\d+)화/);
            
            // Get part numbers (default to 0 if not found)
            const partA = partAMatch ? parseInt(partAMatch[1]) : 0;
            const partB = partBMatch ? parseInt(partBMatch[1]) : 0;
            
            // Get chapter numbers (default to 0 if not found)
            const chapterA = chapterAMatch ? parseInt(chapterAMatch[1]) : 0;
            const chapterB = chapterBMatch ? parseInt(chapterBMatch[1]) : 0;
            
            // Compare by part first, then by chapter
            if (partA !== partB) {
                return partB - partA;
            }
            return chapterB - chapterA;
        });
        if (files) {
            setChapterFiles([...chapterFiles, ...Array.from(files)]);
        }
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
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            console.log(file);
            const buffer = Buffer.from(await file.arrayBuffer());
            const epubObj = await parseEpub(buffer, {
                type: 'buffer',
            })
            setEpubObj(epubObj)
            const split = file.name.split(" ")
            const _chapterTitle = split[split.length - 1].split(".")[0]
            setChapterTitle(_chapterTitle)
            setPublisherKoreanName(epubObj.info?.publisher ?? "")
            console.log(epubObj);
        }
    }

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPicture(file);
        }
    }

    const handleAddWebnovel = async () => {
        const title = webnovelTitle;
        const author_nickname = epubObj.info?.author;
        const publisherKoreanName = epubObj.info?.publisher; // assuming this epub is from korea
        const formData = new FormData();
        formData.append('title', title!);
        formData.append('description', description);
        formData.append('genre', genre);
        formData.append('language', language);
        formData.append('coverArt', picture!);
        formData.append('user_email', user_email); // publisher email
        formData.append('user_nickname', publisherKoreanName!);
        formData.append('publisherEnglishName', publisherEnglishName);
        formData.append('publisherKoreanName', publisherKoreanName);
        formData.append('publisherEmail', publisherEmail);
        formData.append('numberOfFreeChapters', numberOfFreeChapters.toString());
        formData.append('tags', tags);
        formData.append('user_is_author', userIsAuthor.toString()); 
        formData.append('author_email', author_email); // might not be an actual email
        formData.append('author_nickname', author_nickname!);
        formData.append("available_languages", JSON.stringify(availableLanguages));

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

    const handleAddChapter = async () => {
        const maxProgress = chapterEpubObjs.length;
        let progress = 0;
        for (const epubObj of chapterEpubObjs) {
            const htmlString = epubObj.sections?.[1]?.htmlString;
            const text = parseHtmlToText(htmlString!);
            const title = epubObj.info?.title;
            const response = await fetch('/api/add_chapter_admin', {
                method: 'POST',
                body: JSON.stringify({
                    webnovel_id: webnovelId,
                    title: title,
                    content: text,
                }),
            });
            if (!response.ok) {
                alert("Failed to add chapter");
                return;
            }
            progress++;
            setProgress(progress / maxProgress * 100);
        }

        alert("All chapters added successfully");
    }

    return <div className="flex flex-col space-y-4 items-center justify-center max-w-screen-md p-4 mx-auto">
        <TextField className='w-[50%]' label="User (Not Author) Email" type="text" value={user_email} onChange={(e) => setUserEmail(e.target.value)} />
        <TextField className='w-[50%]' label="Author Email" type="text" value={author_email} onChange={(e) => setAuthorEmail(e.target.value)} />
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
            <input type="file" onChange={handlePictureChange} />
        </div>
        <div className='flex flex-row space-x-4'>
            <p>Webnovel Epub File</p>
            <input type="file" onChange={handleFileChange} />
        </div>
        <TextField className='w-[50%]' label="Webnovel ID" type="text" value={webnovelId} onChange={(e) => setWebnovelId(e.target.value)} />
        <TextField className='w-[50%]' label="Webnovel Title" type="text" value={webnovelTitle} onChange={(e) => setWebnovelTitle(e.target.value)} />
        <TextField className='w-[50%]' label="Number of Free Chapters" type="text" value={numberOfFreeChapters} onChange={(e) => setNumberOfFreeChapters(Number(e.target.value))} />
        <TextField className='w-[50%]' label="Publisher English Name" type="text" value={publisherEnglishName} onChange={(e) => setPublisherEnglishName(e.target.value)} />
        <TextField className='w-[50%]' label="Publisher Korean Name" type="text" value={publisherKoreanName} onChange={(e) => setPublisherKoreanName(e.target.value)} />
        <TextField className='w-[50%]' label="Publisher Email" type="text" value={publisherEmail} onChange={(e) => setPublisherEmail(e.target.value)} />
        <TextField className='w-[50%]' label="Tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        <TextField className='w-[50%]' label="Price (Korean)" type="text" value={priceKorean} onChange={(e) => setPriceKorean(Number(e.target.value))} />
        <TextField className='w-[50%]' label="Price (English)" type="text" value={priceEnglish} onChange={(e) => setPriceEnglish(Number(e.target.value))} />
        <Button color='gray' variant='contained' onClick={handleAddWebnovel}>Add Webnovel</Button>
        <div className='flex flex-row space-x-4'>
            <p>Chapter Epub Files</p>
            <input type="file" multiple onChange={handleChapterFilesChange} />
        </div>
        <div className="py-4"></div>
        <Button color='gray' variant='contained' onClick={handleAddChapter}>Add Chapter</Button>
        <LinearProgress value={progress} />
    </div>
}