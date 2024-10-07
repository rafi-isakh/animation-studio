"use client"
import { Dispatch, SetStateAction, useState } from "react";
import AIEditorCharactersComponent from "@/components/AIEditorCharactersComponent";
import { Modal } from "flowbite-react";
import AIEditorStatsComponent from "@/components/AIEditorStatsComponent";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import AIEditorAdviceComponent from "@/components/AIEditorAdviceComponent";

const AIEditorComponent = ({ openModal, setOpenModal, text, novelLanguage }: { openModal: boolean, setOpenModal: Dispatch<SetStateAction<boolean>>, text: string, novelLanguage: string}) => {

    const [openChars, setOpenChars] = useState(false);
    const [openStats, setOpenStats] = useState(false);
    const { dictionary, language } = useLanguage();

    return (
        <Modal show={openModal} size="2xl" onClose={() => setOpenModal(false)} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="flex flex-col justify-end space-y-4">
                    <AIEditorAdviceComponent content={text} novelLanguage={novelLanguage}/>
                    <button className="button-style px-5 py-2.5 me-2 mb-2" onClick={() => setOpenChars(true)}>{phrase(dictionary, "properNouns", language)}</button>
                    <button className="button-style px-5 py-2.5 me-2 mb-2" onClick={() => setOpenStats(true)}>{phrase(dictionary, "analyze", language)}</button>
                </div>
                <AIEditorCharactersComponent openModal={openChars} setOpenModal={setOpenChars} />
                <AIEditorStatsComponent openModal={openStats} setOpenModal={setOpenStats} text={text} novelLanguage={novelLanguage}/>
            </Modal.Body>
        </Modal>
    )
}

export default AIEditorComponent;