"use client"
import { Button } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import GeneratedPicture from "@/components/GeneratedPicture";

export default function PicturesStudioPage() {
    const [isGeneratingPictures, setIsGeneratingPictures] = useState(false);
    const [pictures, setPictures] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");
    const {language, dictionary} = useLanguage();
    const refs = useRef<(HTMLParagraphElement)[]>([]);

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


    useEffect(() => {
        const adjustFontSize = () => {
            refs.current.forEach((ref, index) => {
                if (ref) {
                    const text = ref.querySelector('h6');
                    if (text) {
                        let fontSize = 24; // Starting font size
                        text.style.fontSize = `${fontSize -2}px`;

                        while (text.scrollWidth > ref.offsetWidth || text.scrollHeight > ref.offsetHeight) {
                            fontSize--;
                            text.style.fontSize = `${fontSize}px`;
                            if (fontSize <= 8) break; // Minimum font size
                        }
                    }
                }
            });
        };

        adjustFontSize();
        window.addEventListener('resize', adjustFontSize);

        return () => window.removeEventListener('resize', adjustFontSize);
    }, [language]); // Re-run when language changes

    return (
        <div className="md:w-[1280px] flex flex-col space-y-4 items-center justify-center mx-auto">
         
         <div className="flex justify-center w-full">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mx-auto mb-16">
             {pictures.length > 0 ? (
                    pictures.map((image, index) => (
                        <GeneratedPicture key={index} index={index} image={image} />
                    ))
                ) : (
                    <div className="col-span-full flex justify-center items-center h-full p-2">
                        <div className="text-center max-w-md">
                            <p className="font-bold mb-2">여러분의 Feed를 생성해 보세요.</p>
                            <p className="text-sm break-keep">
                                구체적인 프롬프트와 키워드로 인물의 행동과 외모, 배경 및 분위기를 묘사해주세요. 
                                예시) 한 소녀, 금발의 공주, 화이트 드레스, 목걸이, 진주 귀걸이
                            </p>
                            </div>
                    </div>
                )}
              </div>
            </div>

         <div className="flex flex-row fixed bottom-5">
            <textarea 
            className="w-[250px] lg:w-[650px] md:w-[650px] h-12 p-2 border border-gray-300 rounded focus:ring-pink-600 focus:border-pink-600" 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder={phrase(dictionary, "typeYourPrompt", language)}
            />
            <Button 
            variant="outlined" 
            color="gray" 
            onClick={generatePictures} 
            disabled={isGeneratingPictures}
            className='px-4 py-3 font-bold border border-gray-600 ml-4 bg-white'
            >
                {isGeneratingPictures ? (
                    // Generating..
<<<<<<< Updated upstream
                    <p className="text-[16px]">{phrase(dictionary, "generatingPrompt", language)}</p> 
                    ) : (
                    // Generate
                    <p className="text-[16px]">{phrase(dictionary, "generaedPrompt", language)}</p>) 
=======
                    <p ref={(el) => (refs.current[0] = el)} className="text-[10px]">{phrase(dictionary, "generatingPrompt", language)}</p> 
                    ) : (
                    // Generate
                    <p ref={(el) => (refs.current[1] = el)} className="text-[10px]">{phrase(dictionary, "generaedPrompt", language)}</p>) 
>>>>>>> Stashed changes
                    }
                  {/* Palette icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    className="lucide lucide-palette ml-3 text-pink-600">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                    </svg>
               </Button>
            </div>
        </div>  
    )

}
