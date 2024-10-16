"use client"
import { Button } from "@mui/material";
import { useState, useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import CharacterInfo from '@/components/CharacterInfo';

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
    const {language, dictionary} = useLanguage();


    const processSSEResponse = async (response: Response, callback: (data: any) => void, setIsGenerating: (isGenerating: boolean) => void) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error("No response body");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedData = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const elements = chunk.split('\n');
            for (const element of elements) {
                if (element.startsWith('data: ')) {
                    const eventData = element.slice(6); // Remove 'data: ' prefix
                    const parsedData = JSON.parse(eventData);
                    const text = parsedData.text;
                    callback(text);
                    accumulatedData = text;
                }
            }
        }
        setIsGenerating(false);
        return accumulatedData;
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

            const generatedLogline = await processSSEResponse(response, (data) => {
                setStreamedLogline(data);
            }, setIsGeneratingLogline);
            return generatedLogline;

        } catch (error) {
            console.error("Error generating logline:", error);
        }
    }

    // main character
    const generateMainCharacter = async (logline: string) => {
        setIsGeneratingMainCharacter(true);
        setMainCharacter("");

        try {
            const response = await fetch('/api/onoma/fabulator/main-character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: logline,
                }),
            });

            const responseData = await response.json();
            setMainCharacter(JSON.stringify(responseData));
            return JSON.stringify(responseData);

        } catch (error) {
            console.error("Error generating logline:", error);
        } finally {
            setIsGeneratingMainCharacter(false);
        }
    }


    const generateMainCharacterSentence = async (mainCharacter: string) => {
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

            const generatedMainCharacterSentence = await processSSEResponse(response, (data) => {
                setStreamedMainCharacterSentence(data);
            }, setIsGeneratingMainCharacterSentence);
            return generatedMainCharacterSentence;

        } catch (error) {
            console.error("Error generating main character sentence:", error);
        }
    }

    //Sub Character

    const generateSubCharacter = async (mainCharacter: string, logline: string) => {
        setIsGeneratingSubCharacter(true);
        setSubCharacter("");
        console.log("mainCharacter", mainCharacter);
        try {
            const response = await fetch('/api/onoma/fabulator/sub-character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: logline,
                    characters: JSON.stringify([mainCharacter]),
                }),
            });

            const responseData = await response.json();
            setSubCharacter(JSON.stringify(responseData));
            return JSON.stringify(responseData);

        } catch (error) {
            console.error("Error generating sub character sentence:", error);
        } finally {
            setIsGeneratingSubCharacter(false);
        }
    }


    const generateSubCharacterSentence = async (subCharacter: string) => {
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

            const generatedSubCharacterSentence = await processSSEResponse(response, (data) => {
                setStreamedSubCharacterSentence(data);
            }, setIsGeneratingSubCharacterSentence);
            return generatedSubCharacterSentence;

        } catch (error) {
            console.error("Error generating sub character sentence:", error);
        }
    }

    const generateEpisodeConfig = async (mainCharacter: string, subCharacter: string, logline: string) => {
        setIsGeneratingEpisodeConfig(true);
        setStreamedEpisodeConfig("");
        try {
            const response = await fetch('/api/onoma/fabulator/episode-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: logline,
                    mainCharacters: JSON.stringify([mainCharacter]),
                    subCharacters: JSON.stringify([subCharacter]),
                }),
            });

            const generatedEpisodeConfig = await processSSEResponse(response, (data) => {
                setStreamedEpisodeConfig(data);
            }, setIsGeneratingEpisodeConfig);
            return generatedEpisodeConfig;

        } catch (error) {
            console.error("Error generating episode config:", error);
        }
    }

    const generateSynopsis = async (mainCharacter: string, subCharacter: string, logline: string, episodeConfig: string) => {
        setIsGeneratingSynopsis(true);
        setStreamedSynopsis("");
        try {
            const response = await fetch('/api/onoma/fabulator/synopsis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logline: logline,
                    mainCharacters: JSON.stringify([mainCharacter]),
                    subCharacters: JSON.stringify([subCharacter]),
                    episodeConfig: episodeConfig,
                }),
            });

            const generatedSynopsis = await processSSEResponse(response, (data) => {
                setStreamedSynopsis(data);
            }, setIsGeneratingSynopsis);
            return generatedSynopsis;

        } catch (error) {
            console.error("Error generating synopsis:", error);
        }
    }
    const generateAll = async () => {
        const generatedLogline = await generateLogline();
        const generatedMainCharacter = await generateMainCharacter(generatedLogline!);
        const generatedSubCharacter = await generateSubCharacter(generatedMainCharacter!, generatedLogline!);
        const generatedEpisodeConfig = await generateEpisodeConfig(generatedMainCharacter!, generatedSubCharacter!, generatedLogline!);
        const generatedSynopsis = await generateSynopsis(generatedMainCharacter!, generatedSubCharacter!, generatedLogline!, generatedEpisodeConfig!);
    }
    return (
        <div className="max-[300px]:w-[350px] md:w-[1280px] flex flex-col space-y-4 items-center justify-center mx-auto mb-24">
            <div className="max-[300px]:w-[350px] sm:w-[720px] text-left pt-10">
              <h1 className="font-bold">
                {/* 세계관 설정 : Worldview setting */}
                {phrase(dictionary, "worldviewSetting", language)}
              </h1>
            </div>

            <div className="max-[300px]:w-[350px] w-[350px] sm:w-[720px] border rounded-xl py-10 px-6 mt-10">
            <h1 className="font-bold mb-10">
              {/* 장르 및 키워드 :  */}
              {phrase(dictionary, "genresAndKeyword", language)}
            </h1>
            <div className="flex flex-col gap-4 ">
                <label htmlFor="">
                    {/* Genres */}
                    {phrase(dictionary, "genre", language)}
                </label>
                <input 
                className="rounded-md focus:ring-pink-600 focus:border-pink-600" 
                type="text" 
                value={genres} 
                onChange={(e) => setGenres(e.target.value)} 
                placeholder={phrase(dictionary, "genrePlaceholder", language)} /> 

                <label htmlFor="">
                    {/* Keywords */}
                    {phrase(dictionary, "keyword", language)}
                </label>
                <input 
                className="rounded-md focus:ring-pink-600 focus:border-pink-600 " 
                type="text" 
                value={keywords} 
                onChange={(e) => setKeywords(e.target.value)} 
                placeholder={phrase(dictionary, "keywordPlaceholder", language)} />
                <div className="flex flex-row justify-center space-y-3 pb-4 gap-4">
               
                <Button
                    variant="outlined"
                    color="gray"
                    onClick={generateLogline}
                    disabled={isGeneratingLogline}
                    className="w-64 self-end font-bold border border-gray-600 ml-4 bg-white hover:text-pink-600 hover:border-pink-600"
                >
                    {isGeneratingLogline ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p> ) 
                                         : (<p>{phrase(dictionary, "generatingLogline", language)}</p> )
                    }
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
                        className="lucide lucide-pencil-line ml-3 hidden min-[635px]:block md:block"
                    >
                    <path d="M12 20h9"/>
                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
                    <path d="m15 5 3 3"/>
                    </svg>

                 </Button>

                 <Button
                    variant="outlined"
                    color="gray"
                    onClick={generateAll}
                    className="w-64 self-end font-bold border border-gray-600 bg-white hover:text-pink-600 hover:border-pink-600"
                     >　
                     {phrase(dictionary, "generateAll", language)}
                　</Button>

                </div>

                </div>
            </div>

            <div className="min-[300px]:w-[350px] sm:w-[720px] text-left pt-6">
                <h1 className="font-bold">
                    {/* 로그라인 */}
                    {phrase(dictionary, "logline", language)}

                </h1>
            </div>

             {/* Logline part */}
            <div className="min-[300px]:w-[350px] w-[350px] sm:w-[720px] bg-white rounded-xl border py-6 px-6 w-[450px] sm:w-[720px] mt-10 space-y-4">

            <div className="flex flex-col gap-4 ">                
                <div className="bg-gray-100 p-4 leading-loose">
                    {streamedLogline}
                </div>

                <Button 
                variant="outlined" 
                color="gray" 
                onClick={() => generateMainCharacter(streamedLogline)} 
                disabled={isGeneratingMainCharacter}
                className="self-center font-bold border border-gray-600 bg-white hover:text-pink-600 hover:border-pink-600"
                >
                    {isGeneratingMainCharacter ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p>) 
                                               : (<p>{phrase(dictionary, "createMainCharacter", language)}</p>)}

                    <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            className="lucide lucide-brush ml-3"
                        >
                          <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
                          <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
                        </svg>

                </Button>
                <div className="">
                        {isGeneratingMainCharacter ? (
                            <></>
                        ) : (
                            <CharacterInfo data={mainCharacter} title="주연 캐릭터" />
                        )}
                </div>
            </div>
            </div>
            
            <div className="max-[300px]:w-[350px] sm:w-[720px] text-left pt-6">
                <h1 className="font-bold">
                    {/* 캐릭터 설정 */}
                    <p>{phrase(dictionary, "characterSetting", language)}</p>
                </h1>
            </div>
        
            <div className="max-[300px]:w-[350px] w-[350px] sm:w-[720px] flex flex-col bg-white rounded-xl border py-6 px-6  mt-10 space-y-4">
                <Button 
                    variant="outlined" 
                    color="gray" 
                    onClick={() => generateSubCharacter(mainCharacter, streamedLogline)} 
                    disabled={isGeneratingSubCharacter}
                    className="self-center font-bold border border-gray-600  bg-white hover:text-pink-600 hover:border-pink-600"
                    >
                        {isGeneratingSubCharacter ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p>) 
                                                  : (<p>{phrase(dictionary, "createSubCharacter", language)}</p>)}

                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            className="lucide lucide-brush ml-3"
                        >
                          <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
                          <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
                        </svg>

                    </Button>

                    <div className="">
                        {subCharacter && <CharacterInfo data={subCharacter} title="조연 캐릭터" />}
                    
                     </div>
            </div>


            <div className="max-[300px]:w-[350px] sm:w-[720px] text-left pt-6">
                <h1 className="font-bold">
                    {/* 줄거리 synopsis */}
                    <p>{phrase(dictionary, "synopsis", language)}</p>
                </h1>
            </div>


            <div className="max-[300px]:w-[350px] w-[350px] sm:w-[720px] flex flex-col justify-center bg-white rounded-xl border py-6 px-6  mt-10 space-y-4">
                
               {/* <div className="bg-gray-100 p-4 leading-loose">
                    {streamedMainCharacterSentence}
                </div> 
                        
                <Button 
                    variant="outlined" 
                    color="gray" 
                    onClick={() => generateMainCharacterSentence(mainCharacter)} 
                    disabled={isGeneratingMainCharacterSentence}
                    className="self-center font-bold border border-gray-600 bg-white hover:text-pink-600 hover:border-pink-600"
                >
                    {isGeneratingMainCharacterSentence ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p>) 
                                                       : (<p>{phrase(dictionary, "createMainCharacterSentence", language)}</p>)}
                </Button>
              

                <div className="bg-gray-100 p-4 leading-loose">
                    {streamedSubCharacterSentence}
                </div>


                <Button 
                    variant="outlined" 
                    color="gray" 
                    onClick={() => generateSubCharacterSentence(subCharacter)}
                    disabled={isGeneratingSubCharacterSentence}
                    className="self-center font-bold border border-gray-600 bg-white hover:text-pink-600 hover:border-pink-600"
                >
                    {isGeneratingSubCharacterSentence ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p> ) 
                                                      : (<p>{phrase(dictionary, "createSubCharacterSentence", language)}</p>)}
                </Button> */}

                <div className="bg-gray-100 p-4 leading-loose">
                    {streamedEpisodeConfig}
                </div>


                <Button 
                    variant="outlined" 
                    color="gray" 
                    onClick={() => generateEpisodeConfig(mainCharacter, subCharacter, streamedLogline)} 
                    disabled={isGeneratingEpisodeConfig}
                    className="self-center font-bold border border-gray-600 bg-white hover:text-pink-600 hover:border-pink-600"
                >
                    {isGeneratingEpisodeConfig ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p>) 
                                               : (<p>{phrase(dictionary, "createEpisode", language)}</p>)}
                </Button>


                <div className="bg-gray-100 p-4 leading-loose">
                    {streamedSynopsis}
                </div>

                <Button 
                variant="outlined" 
                color="gray" 
                onClick={() => generateSynopsis(mainCharacter, subCharacter, streamedLogline, streamedEpisodeConfig)} 
                disabled={isGeneratingSynopsis}
                className="self-center font-bold border border-gray-600 bg-white hover:text-pink-600 hover:border-pink-600"
                >
                    {isGeneratingSynopsis ? (<p>{phrase(dictionary, "generatingPrompt", language)}</p> ) 
                                          : (<p>{phrase(dictionary, "createSynopsis", language)}</p>)}
                </Button>

             

            </div>
        </div>
    )
}