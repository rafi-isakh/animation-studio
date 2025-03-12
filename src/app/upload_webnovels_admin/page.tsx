"use client"

import { parseEpub } from '@gxl/epub-parser'
import { useState } from 'react';
import { parseHtmlToText } from '@/utils/stringUtils';
import { Button, LinearProgress, TextField } from '@mui/material';
import { Input } from '@mui/material';

export default function UploadWebnovelsAdmin() {
    const [file, setFile] = useState<File | null>(null);
    const [email, setEmail] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [genre, setGenre] = useState<string>("romance");
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

    const handleChapterFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).sort((a, b) => {
            // Extract numbers from filenames and compare them numerically
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
            return numA - numB;
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
        const author = epubObj.info?.author;
        const publisherKoreanName = epubObj.info?.publisher;
        const formData = new FormData();
        formData.append('title', title!);
        formData.append('description', description);
        formData.append('genre', genre);
        formData.append('language', language);
        formData.append('coverArt', picture!);
        formData.append('email', email);
        formData.append('author', author!);
        formData.append('publisherEnglishName', publisherEnglishName);
        formData.append('publisherKoreanName', publisherKoreanName);
        formData.append('publisherEmail', publisherEmail);
        formData.append('numberOfFreeChapters', numberOfFreeChapters.toString());
        formData.append('tags', tags);
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
        <TextField label="Email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
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
        <TextField label="Webnovel ID" type="text" value={webnovelId} onChange={(e) => setWebnovelId(e.target.value)} />
        <TextField label="Webnovel Title" type="text" value={webnovelTitle} onChange={(e) => setWebnovelTitle(e.target.value)} />
        <TextField label="Number of Free Chapters" type="text" value={numberOfFreeChapters} onChange={(e) => setNumberOfFreeChapters(Number(e.target.value))} />
        <TextField label="Publisher English Name" type="text" value={publisherEnglishName} onChange={(e) => setPublisherEnglishName(e.target.value)} />
        <TextField label="Publisher Korean Name" type="text" value={publisherKoreanName} onChange={(e) => setPublisherKoreanName(e.target.value)} />
        <TextField label="Publisher Email" type="text" value={publisherEmail} onChange={(e) => setPublisherEmail(e.target.value)} />
        <TextField label="Tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
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