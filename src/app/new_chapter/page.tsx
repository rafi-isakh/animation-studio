"use client"

import AddChapterComponent from "@/components/AddChapterComponent";
import { useSearchParams } from "next/navigation";
import { Suspense } from 'react'


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

const NewChapterWrapper = () => {
    return (
        <Suspense>
            <NewChapter/>
        </Suspense>
    )
}

export default NewChapterWrapper;