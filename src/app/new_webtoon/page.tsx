"use client"
export default function NewWebtoon() {
    const addWebtoon = async (formData: FormData) => {
        const response = await fetch(`/api/add_webtoon`, {
            method: "POST",
            body: formData
        })
        const data = await response.json()
    }
    return (
        <form action={addWebtoon} className="flex flex-col gap-4 max-w-screen-md mx-auto">
            <input type="text" name="title" placeholder="Title" />
            <input type="text" name="description" placeholder="Description" />
            <input type="text" name="rootDirectory" placeholder="Root Directory" />
            <input type="text" name="genre" placeholder="Genre" />
            <input type="text" name="language" placeholder="Language" />
            <button type="submit">Add Webtoon</button>
        </form>
    )
}