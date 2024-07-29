"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useState } from "react";
import '@/styles/globals.css'


const AIEditorCharactersComponent = () => {
    const { dictionary, language } = useLanguage();
    const [names, setNames] = useState<string[]>([""]);

    const handleNamesChange = (index: number, value: string) => {
        const updatedNames = [...names];
        updatedNames[index] = value;
        setNames(updatedNames);
    }

    const addName = () => {
        const updatedNames = [...names, ""];
        setNames(updatedNames);
    }

    return (
        <div className="max-w-screen-md py-4 flex flex-col space-y-4 mx-auto justify-start">
            {names?.map((item, index) => (
                <input
                    key={index}
                    type="text"
                    value={item}
                    className='input border-none rounded focus:ring-pink-600 w-full bg-gray-200'
                    onChange={(e) => handleNamesChange(index, e.target.value)}
                />
            ))
            }
            <button className="button-style px-5 py-2.5 me-2 mb-2" onClick={addName}><i className="fa-solid fa-plus"></i></button>
        </div>
    )
}

export default AIEditorCharactersComponent;