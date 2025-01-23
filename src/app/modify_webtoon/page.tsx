"use client"
import { Button, Input } from "@mui/material"
import { useState } from "react"
export default function NewWebtoon() {
    const [isLoading, setIsLoading] = useState(false)
    const addWebtoon = async (formData: FormData) => {
        setIsLoading(true)
        const response = await fetch(`/api/modify_webtoon_admin`, {
            method: "POST",
            body: formData
        })
        if (!response.ok) {
            alert("Failed to add webtoon")
        }
        else {
            alert("Successfully modified webtoon")
        }
        setIsLoading(false)
    }
    return (
        <form action={addWebtoon} className="flex flex-col gap-4 max-w-screen-md mx-auto">
            <Input type="text" name="title" placeholder="Title" />
            <Input type="text" name="max_episodes" placeholder="Max Episodes" />
            <Button color='gray' type="submit" disabled={isLoading}>Modify Webtoon</Button>
        </form>
    )
}