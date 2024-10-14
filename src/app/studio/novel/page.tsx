"use client"
import { Button } from "@mui/material";
import { useState, useEffect } from "react";

export default function NovelStudioPage() {
    const [genres, setGenres] = useState("");
    const [keywords, setKeywords] = useState("");
    const [streamedEpisodeConfig, setStreamedEpisodeConfig] = useState("");
    const [isGeneratingEpisodeConfig, setIsGeneratingEpisodeConfig] = useState(false);
    const [streamedLogline, setStreamedLogline] = useState("");
    const [isGeneratingLogline, setIsGeneratingLogline] = useState(false);
    const [mainCharacter, setMainCharacter] = useState("");
    const [isGeneratingMainCharacter, setIsGeneratingMainCharacter] = useState(false);
    const [isGeneratingMainCharacterSentence, setIsGeneratingMainCharacterSentence] = useState(false);
    const [streamedMainCharacterSentence, setStreamedMainCharacterSentence] = useState("");
    const [subCharacter, setSubCharacter] = useState("");
    const [isGeneratingSubCharacter, setIsGeneratingSubCharacter] = useState(false);
    const [isGeneratingSubCharacterSentence, setIsGeneratingSubCharacterSentence] = useState(false);
    const [streamedSubCharacterSentence, setStreamedSubCharacterSentence] = useState("");
    const [streamedSynopsis, setStreamedSynopsis] = useState("");
    const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);

    const processSSEResponse = async (response: Response, callback: (data: any) => void, setIsGenerating: (isGenerating: boolean) => void) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error("No response body");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            console.log(chunk);
            const elements = chunk.split('\n');
            for (const element of elements) {
                if (element.startsWith('data: ')) {
                    const eventData = element.slice(6); // Remove 'data: ' prefix
                    callback(eventData);
                }
            }
        }
        setIsGenerating(false);
    }

    const generateLogline = async () => {
        setIsGeneratingLogline(true);
        setStreamedLogline("");

        try {
            const response = await fetch('/api/onoma/fabulator/logline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    genres: genres,
                    keywords: keywords,
                }),
            });

            processSSEResponse(response, (data) => {
                setStreamedLogline(JSON.parse(data).text);
            }, setIsGeneratingLogline);

        } catch (error) {
            console.error("Error generating logline:", error);
        }
    }

    const generateMainCharacter = async () => {
        setIsGeneratingMainCharacter(true);
        setMainCharacter("");

        try {
            const response = await fetch('/api/onoma/fabulator/main-character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: streamedLogline,
                }),
            });

            const responseData = await response.json();
            setMainCharacter(JSON.stringify(responseData));

        } catch (error) {
            console.error("Error generating logline:", error);
        } finally {
            setIsGeneratingMainCharacter(false);
        }
    }

    const generateMainCharacterSentence = async () => {
        setIsGeneratingMainCharacterSentence(true);
        setStreamedMainCharacterSentence("");

        try {
            const response = await fetch('/api/onoma/fabulator/main-character-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character: mainCharacter,
                }),
            });

            processSSEResponse(response, (data) => {
                setStreamedMainCharacterSentence(JSON.parse(data).text);
            }, setIsGeneratingMainCharacterSentence);

        } catch (error) {
            console.error("Error generating main character sentence:", error);
        }
    }
    const generateSubCharacter = async () => {
        setIsGeneratingSubCharacter(true);
        setSubCharacter("");
        try {
            const response = await fetch('/api/onoma/fabulator/sub-character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: streamedLogline,
                    characters: JSON.stringify([mainCharacter]),
                }),
            });

            const responseData = await response.json();
            setSubCharacter(JSON.stringify(responseData));

        } catch (error) {
            console.error("Error generating sub character sentence:", error);
        } finally {
            setIsGeneratingSubCharacter(false);
        }
    }
    const generateSubCharacterSentence = async () => {
        setIsGeneratingSubCharacterSentence(true);
        setStreamedSubCharacterSentence("");
        try {
            const response = await fetch('/api/onoma/fabulator/sub-character-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character: subCharacter,
                }),
            });

            processSSEResponse(response, (data) => {
                setStreamedSubCharacterSentence(JSON.parse(data).text);
            }, setIsGeneratingSubCharacterSentence);

        } catch (error) {
            console.error("Error generating sub character sentence:", error);
        }
    }

    const generateEpisodeConfig = async () => {
        setIsGeneratingEpisodeConfig(true);
        setStreamedEpisodeConfig("");
        try {
            const response = await fetch('/api/onoma/fabulator/episode-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: streamedLogline,
                    mainCharacters: JSON.stringify([mainCharacter]),
                    subCharacters: JSON.stringify([subCharacter]),
                }),
            });

            processSSEResponse(response, (data) => {
                setStreamedEpisodeConfig(JSON.parse(data).text);
            }, setIsGeneratingEpisodeConfig);

        } catch (error) {
            console.error("Error generating episode config:", error);
        }
    }

    const generateSynopsis = async () => {
        setIsGeneratingSynopsis(true);
        setStreamedSynopsis("");
        try {
            const response = await fetch('/api/onoma/fabulator/synopsis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: streamedLogline,
                    mainCharacters: JSON.stringify([mainCharacter]),
                    subCharacters: JSON.stringify([subCharacter]),
                    episodeConfig: streamedEpisodeConfig,
                }),
            });

            processSSEResponse(response, (data) => {
                setStreamedSynopsis(JSON.parse(data).text);
            }, setIsGeneratingSynopsis);

        } catch (error) {
            console.error("Error generating synopsis:", error);
        }
    }

    return (
        <div className="md:w-[1280px] flex flex-col space-y-4 items-center justify-center mx-auto">
            <h1>Studio</h1>
            <div className="flex flex-col gap-4">
                <input type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Genres" />
                <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords" />
            </div>
            <Button
                variant="contained"
                color="gray"
                onClick={generateLogline}
                disabled={isGeneratingLogline}
            >
                {isGeneratingLogline ? "Generating..." : "Generate Logline"}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {streamedLogline}
            </div>
            <Button variant="contained" color="gray" onClick={generateMainCharacter} disabled={isGeneratingMainCharacter}>
                {isGeneratingMainCharacter ? "Generating..." : "Generate Main Character "}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {mainCharacter}
            </div>
            <Button variant="contained" color="gray" onClick={generateMainCharacterSentence} disabled={isGeneratingMainCharacterSentence}>
                {isGeneratingMainCharacterSentence ? "Generating..." : "Generate Main Character Sentence"}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {streamedMainCharacterSentence}
            </div>
            <Button variant="contained" color="gray" onClick={generateSubCharacter} disabled={isGeneratingSubCharacter}>
                {isGeneratingSubCharacter ? "Generating..." : "Generate Sub Character "}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {subCharacter}
            </div>
            <Button variant="contained" color="gray" onClick={generateSubCharacterSentence} disabled={isGeneratingSubCharacterSentence}>
                {isGeneratingSubCharacterSentence ? "Generating..." : "Generate Sub Character Sentence"}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {streamedSubCharacterSentence}
            </div>
            <Button variant="contained" color="gray" onClick={generateEpisodeConfig} disabled={isGeneratingEpisodeConfig}>
                {isGeneratingEpisodeConfig ? "Generating..." : "Generate Episode Config"}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {streamedEpisodeConfig}
            </div>
            <Button variant="contained" color="gray" onClick={generateSynopsis} disabled={isGeneratingSynopsis}>
                {isGeneratingSynopsis ? "Generating..." : "Generate Synopsis"}
            </Button>
            <div className="w-[720px] bg-gray-100 p-4">
                {streamedSynopsis}
            </div>
        </div>
    )
}
