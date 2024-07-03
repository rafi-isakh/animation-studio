"use client"

import AddChapterComponent from "@/components/AddChapterComponent";
import { useSearchParams } from "next/navigation";

function NewChapter() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    if (id) {
        return (
            <AddChapterComponent webnovelId={id} />
        );
    }
    else {
        return (
            <div></div>
        )
    }
};

export default NewChapter;