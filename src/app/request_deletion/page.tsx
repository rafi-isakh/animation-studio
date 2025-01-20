"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from "@/utils/phrases"
import { Button } from "@mui/material";

export default function RequestDeletionPage() {
    const {dictionary, language} = useLanguage();
    const handleRequestDeletion = async () => {
        const response = await fetch("/api/request_deletion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            alert(phrase(dictionary, "requestAccountDeletionError", language));
        }
        else {
            alert(phrase(dictionary, "requestAccountDeletionSuccess", language));
        }
    }
    return (
        <div className="flex flex-col space-y-4 items-center mt-32 max-w-screen-md mx-auto">
            <h1 className="text-2xl font-bold">{phrase(dictionary, "requestAccountDeletion", language)}</h1>
            <div>
            <h2 className="text-lg">{phrase(dictionary, "requestAccountDeletionDescription", language)}</h2>
            <h2 className="text-lg">{phrase(dictionary, "requestAccountDeletionDeletedInfo", language)}</h2>
            </div>
            <Button color='gray' variant='outlined' onClick={handleRequestDeletion}>{phrase(dictionary, "requestAccountDeletionButton", language)}</Button>
        </div>
    )
}