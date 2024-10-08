"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Dispatch, SetStateAction, useState } from "react";
import '@/styles/globals.css'
import { Modal } from "flowbite-react";
import { Button } from "@mui/material";

const AIEditorCharactersComponent = ({ openModal, setOpenModal }: { openModal: boolean, setOpenModal: Dispatch<SetStateAction<boolean>> }) => {
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

    const removeName = (index: number) => {
        const updatedNames = names.filter((name, i) => i != index);
        setNames(updatedNames);
    }

    const confirm = async () => {
        setOpenModal(false);

    }

    const handleXClick = (index: number, target: EventTarget) => {
        removeName(index);
    }

    return (
        <Modal show={openModal} size="xl" onClose={() => setOpenModal(false)} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="max-w-screen-md py-4 flex flex-col space-y-4 mx-auto justify-start">
                    <div className="font-bold">{phrase(dictionary, "properNouns", language)}</div>
                    <div>{phrase(dictionary, "properNounsDescription", language)}</div>
                    {names?.map((item, index) => (
                        <div key={index} className="relative">
                            <input
                                type="text"
                                value={item}
                                className='input border-none rounded focus:ring-pink-600 w-full bg-gray-200'
                                onChange={(e) => handleNamesChange(index, e.target.value)}
                            />
                            <Button className="absolute right-4 top-1/4" onClick={(e) => handleXClick(index, e.target)}><i className="fa-solid fa-xmark text-[#142448]"></i></Button>
                        </div>
                    ))
                    }
                    <div className="flex flex-col">
                        <Button className="button-style px-5 py-2.5 me-2 mb-2" onClick={addName}><i className="fa-solid fa-plus"></i></Button>
                        <Button className="button-style px-5 py-2.5 me-2 mb-2" onClick={confirm}>{phrase(dictionary, "ok", language)}</Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default AIEditorCharactersComponent;