"use client"

import WriteComponent from "@/components/WriteComponent"
import { useSearchParams } from "next/navigation";

function NewChapter() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    if (id) {
        return (
            <WriteComponent webnovelId={id} />
        );
    }
    else {
        return (
            <div></div>
        )
    }
};

export default NewChapter;