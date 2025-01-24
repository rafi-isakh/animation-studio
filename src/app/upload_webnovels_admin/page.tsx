"use client"

import { parseEpub } from '@gxl/epub-parser'
import { useState } from 'react';
import { parseHtmlToText } from '@/utils/stringUtils';
import { Button, TextField } from '@mui/material';
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            console.log(file);
            const buffer = Buffer.from(await file.arrayBuffer());
            const epubObj = await parseEpub(buffer, {
                type: 'buffer',
            })
            setEpubObj(epubObj);
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
        const htmlString = epubObj.sections?.[1]?.htmlString;
        const text = parseHtmlToText(htmlString!);
        const title = epubObj.info?.title;
        const author = epubObj.info?.author;
        const formData = new FormData();
        formData.append('title', title!);
        formData.append('description', description);
        formData.append('genre', genre);
        formData.append('language', language);
        formData.append('coverArt', picture!);
        formData.append('email', email);
        formData.append('author', author!);
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
        const htmlString = epubObj.sections?.[1]?.htmlString;
        const text = parseHtmlToText(htmlString!);
        const response = await fetch('/api/add_chapter_admin', {
            method: 'POST',
            body: JSON.stringify({
                webnovel_id: webnovelId,
                title: chapterTitle,
                content: text,
            }),
        });
        if (!response.ok) {
            alert("Failed to add chapter");
        }
        else {
            alert(`Chapter ${chapterTitle} added successfully`);
        }
    }

    return <div className="flex flex-col space-y-4 items-center justify-center h-screen w-128">
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
            <p>Epub File</p>
            <input type="file" onChange={handleFileChange} />
        </div>
        <Button color='gray' variant='contained' onClick={handleAddWebnovel}>Add Webnovel</Button>
        <div className="py-4"></div>
        <TextField label="Chapter Title" type="text" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
        <Button color='gray' variant='contained' onClick={handleAddChapter}>Add Chapter</Button>
    </div>
}