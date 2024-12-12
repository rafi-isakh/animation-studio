"use client"
import { Button, Input } from "@mui/material"
import { useState } from "react"
export default function NewWebtoon() {
    const [isLoading, setIsLoading] = useState(false)
    const addWebtoon = async (formData: FormData) => {
        setIsLoading(true)
        const response = await fetch(`/api/add_webtoon_admin`, {
            method: "POST",
            body: formData
        })
        if (!response.ok) {
            alert("Failed to add webtoon")
        }
        setIsLoading(false)
    }
    return (
        <form action={addWebtoon} className="flex flex-col gap-4 max-w-screen-md mx-auto">
            <Input type="text" name="title" placeholder="Title" />
            <Input type="text" name="description" placeholder="Description" />
            <Input type="text" name="rootDirectory" placeholder="Root Directory" />
            <Input type="text" name="genre" placeholder="Genre" />
            <Input type="text" name="language" placeholder="Language" defaultValue="korean" />
            <Input type="text" name="author" placeholder="Author" />
            <Input type="text" name="email" placeholder="Email" />
            <Button color='gray' type="submit" disabled={isLoading}>Add Webtoon</Button>
        </form>
    )
}