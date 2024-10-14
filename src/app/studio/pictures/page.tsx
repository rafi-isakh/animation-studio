"use client"
import { Button } from "@mui/material";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function PicturesStudioPage() {
    const [isGeneratingPictures, setIsGeneratingPictures] = useState(false);
    const [pictures, setPictures] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");

    const generatePictures = async () => {
        setIsGeneratingPictures(true);

        try {
            const response = await fetch('/api/onoma/anima/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);
            setPictures(data.images);
        } catch (error) {
            console.error('Error generating pictures:', error);
        } finally {
            setIsGeneratingPictures(false);
        }
    };

    return (
        <div className="md:w-[1280px] flex flex-col space-y-4 items-center justify-center mx-auto">
            <textarea className="w-[480px] h-40 p-2 border border-gray-300 rounded-lg" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt" />
            <Button variant="contained" color="gray" onClick={generatePictures} disabled={isGeneratingPictures}>
                {isGeneratingPictures ? "Generating..." : "Generate Pictures"}
            </Button>
            <div className="grid grid-cols-2 gap-4">
                {pictures.map((image, index) => (
                    <div key={index} className="w-80 h-80 border border-gray-300">
                        <Image
                            src={`data:image/png;base64,${image}`}
                            alt={`Generated image ${index + 1}`}
                            width={320}
                            height={320}
                            className="object-cover w-full h-full"
                        />
                    </div>
                ))}
            </div>
        </div>  
    )

}
