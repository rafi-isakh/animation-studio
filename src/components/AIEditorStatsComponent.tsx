"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import '@/styles/globals.css'
import { Modal } from "flowbite-react";

const AIEditorStatsComponent = ({ openModal, setOpenModal, text, novelLanguage }: { openModal: boolean, setOpenModal: Dispatch<SetStateAction<boolean>>, text: string, novelLanguage: string}) => {
    const { dictionary, language } = useLanguage();
    const [adverbs, setAdverbs] = useState<string[]>([""]);
    const [sentLength, setSentLength] = useState(0);
    const [readability, setReadability] = useState(0);
    const [dialogues, setDialogues] = useState<string[]>([""]);

    useEffect(() => {
        const fetchAdverbStats = async () => {
            const toSend = {
                'text': text,
                'language': novelLanguage
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/adverbs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(toSend),
            });
            const data = await response.json();
            
            setAdverbs(data);
        }
        const fetchSentLengthStats = async () => {
            const toSend = {
                'text': text,
                'language': novelLanguage
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/sentence_length`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(toSend),
            });
            const data = await response.json();
            
            setSentLength(data);
        }
        const fetchReadabilityStats = async () => {
            const toSend = {
                'text': text,
                'language': novelLanguage
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/readability`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(toSend),
            });
            const data = await response.json();
            
            setReadability(data);
        }
        const fetchDialogueStats = async () => {
            const toSend = {
                'text': text,
                'language': novelLanguage
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/dialogues`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(toSend),
            });
            const data = await response.json();
            setDialogues(data);
        }
        fetchAdverbStats();
        fetchSentLengthStats();
        fetchReadabilityStats();
        fetchDialogueStats();
    }, [])
    return (
        <Modal show={openModal} size="xl" onClose={() => setOpenModal(false)} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="max-w-screen-md py-4 flex flex-col space-y-4 mx-auto justify-start">
                    <p>Adverbs: {adverbs.length}</p>
                    <p>Average sentence length: {sentLength}</p>
                    <p>Readability: {readability}</p>
                    <p>Dialogues: {dialogues.length}</p>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default AIEditorStatsComponent;