"use client"
import { Button } from "@mui/material";
import { useState, useEffect } from "react";


// main character component start //

const CharacterInfo = ({ data }) => {
    if (!data) return null;

    const { basic_info, appearance, personality, governing_values, relationships } = JSON.parse(data);

    return (
        <div className="space-y-4">
            <section className="bg-gray-100 border rounded border-gray-200 px-3">
                <h2 className="font-bold text-lg py-2 border-gray border-b-2">Basic Info</h2>
                <div className="py-6 space-y-4">
                <p><strong>Name:</strong> {basic_info.name}</p>
                <p><strong>Age:</strong> {basic_info.age}</p>
                <p><strong>Gender:</strong> {basic_info.gender}</p>
                <p><strong>Job:</strong> {basic_info.job}</p>
                <p><strong>Background:</strong> {basic_info.background}</p>
                </div>
            </section>

            <section className="bg-gray-100 border rounded border-gray-200 px-3">
                <h2 className="font-bold text-lg py-2 border-gray border-b-2">Appearance</h2>
                <div className="py-6 space-y-4">
                    <p><strong>Hair Color:</strong> {appearance.hair_color}</p>
                    <p><strong>Hair Style:</strong> {appearance.hair_style}</p>
                    <p><strong>Eye Color:</strong> {appearance.eye_color}</p>
                    <p><strong>Skin Color:</strong> {appearance.skin_color}</p>
                    <p><strong>Symbolic Feature:</strong> {appearance.symbolic_feature}</p>
                    <p><strong>Costume:</strong> {appearance.costume}</p>
                    <p><strong>Body Type:</strong> {appearance.body_type}</p>
                </div>
            </section>

            <section className="bg-gray-100 border rounded border-gray-200 px-3">
                <h2 className="font-bold text-lg py-2 border-gray border-b-2">Personality</h2>
                <div className="py-6 space-y-4">
                    <p><strong>Basic Personality:</strong> {personality.basic_personality}</p>
                    <p><strong>Charm Point:</strong> {personality.charm_point}</p>
                    <p><strong>Weakness:</strong> {personality.weakness}</p>
                </div>
            </section>

            <section className="bg-gray-100 border rounded border-gray-200 px-3">
                <h2 className="font-bold text-lg">Governing Values</h2>
                <p><strong>Belief:</strong> {governing_values.belief}</p>
                <p><strong>Motivation:</strong> {governing_values.motivation}</p>
                <p><strong>Goals:</strong> {governing_values.goals}</p>
                <p><strong>Conflict:</strong> {governing_values.conflict}</p>
            </section>

            <section>
                <h2 className="font-bold text-lg">Relationships</h2>
                <p><strong>Alliance:</strong> {relationships.alliance}</p>
                <p><strong>Enemy:</strong> {relationships.enemy}</p>
                <p><strong>Family Relationship:</strong> {relationships.family_relationship}</p>
                <p><strong>Friendship:</strong> {relationships.friendship}</p>
                <p><strong>Acquaintance:</strong> {relationships.acquaintance}</p>
                <p><strong>Social Relationship:</strong> {relationships.social_relationship}</p>
                <p><strong>Love Interest:</strong> {relationships.love_interest}</p>
            </section>
        </div>
    );
};




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
            <div className="w-[450px] sm:w-[720px] text-left pt-10">
              <h1 className="font-bold">세계관 설정</h1>
            </div>
            <div className="border rounded-xl py-6 px-6 w-[450px] sm:w-[720px] mt-10">
            <h1 className="font-bold mb-10">장르 및 키워드</h1>
            <div className="flex flex-col gap-4 ">
                <label htmlFor="">Genres</label>
                <input 
                className="rounded-md focus:ring-pink-600 focus:border-pink-600" 
                type="text" 
                value={genres} 
                onChange={(e) => setGenres(e.target.value)} 
                placeholder="작품의 Genres 를 입력해 주세요." />

                <label htmlFor="">Keywords</label>
                <input 
                className="rounded-md focus:ring-pink-600 focus:border-pink-600 " 
                type="text" 
                value={keywords} 
                onChange={(e) => setKeywords(e.target.value)} 
                placeholder="작품의 Keywords를 입력해 주세요." />

                <Button
                    variant="outlined"
                    color="gray"
                    onClick={generateLogline}
                    disabled={isGeneratingLogline}
                    className="w-64 self-end font-bold border border-gray-600 ml-4 bg-white"
                >
                    {isGeneratingLogline ? "Generating..." : "Generate Logline"}
                    {/* writing icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        stroke-width="2" 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        className="lucide lucide-pencil-line ml-3 "
                    >
                    <path d="M12 20h9"/>
                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
                    <path d="m15 5 3 3"/>
                    </svg>

                 </Button>
                </div>
            </div>

            <div className="w-[450px] sm:w-[720px] text-left">
                <h1 className="font-bold">로그라인</h1>
            </div>

            {/* Logline part */}
            <div className="bg-white rounded-xl border py-6 px-6 w-[450px] sm:w-[720px] mt-10 space-y-4">
                <div className="bg-gray-100 p-4">
                    {streamedLogline}
                </div>
            </div>
            
            <div className="w-[450px] sm:w-[720px] text-left">
                <h1 className="font-bold">캐릭터 설정</h1>
            </div>
            <div className="bg-white rounded-xl border py-6 px-6 w-[450px] sm:w-[720px] mt-10 space-y-4">
                
                <Button variant="contained" color="gray" onClick={generateMainCharacter} disabled={isGeneratingMainCharacter}>
                    {isGeneratingMainCharacter ? "Generating..." : "Generate Main Character "}
                </Button>
                <div className=" p-4">
                        {isGeneratingMainCharacter ? (
                            <p>Loading...</p>
                        ) : (
                            <CharacterInfo data={mainCharacter} />
                        )}
                </div>
                <Button variant="contained" color="gray" onClick={generateMainCharacterSentence} disabled={isGeneratingMainCharacterSentence}>
                    {isGeneratingMainCharacterSentence ? "Generating..." : "Generate Main Character Sentence"}
                </Button>
                <div className="bg-gray-100 p-4">
                    {streamedMainCharacterSentence}
                </div>
                <Button variant="contained" color="gray" onClick={generateSubCharacter} disabled={isGeneratingSubCharacter}>
                    {isGeneratingSubCharacter ? "Generating..." : "Generate Sub Character "}
                </Button>
                <div className="bg-gray-100 p-4">
                    {subCharacter}
                </div>
                <Button variant="contained" color="gray" onClick={generateSubCharacterSentence} disabled={isGeneratingSubCharacterSentence}>
                    {isGeneratingSubCharacterSentence ? "Generating..." : "Generate Sub Character Sentence"}
                </Button>
                <div className="bg-gray-100 p-4">
                    {streamedSubCharacterSentence}
                </div>
                <Button variant="contained" color="gray" onClick={generateEpisodeConfig} disabled={isGeneratingEpisodeConfig}>
                    {isGeneratingEpisodeConfig ? "Generating..." : "Generate Episode Config"}
                </Button>
                <div className="bg-gray-100 p-4">
                    {streamedEpisodeConfig}
                </div>
                <Button variant="contained" color="gray" onClick={generateSynopsis} disabled={isGeneratingSynopsis}>
                    {isGeneratingSynopsis ? "Generating..." : "Generate Synopsis"}
                </Button>
                <div className="bg-gray-100 p-4">
                    {streamedSynopsis}
                </div>
            </div>
        </div>
    )
}
