"use client"
import { ToonyzCutListComponent } from '@/components/ToonyzCutListComponent';
import { Webnovel } from '@/components/Types';
import { useWebnovels } from '@/contexts/WebnovelsContext';
export default async function Toonyzcut() {
    let { webnovels } = useWebnovels();
    const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];
    webnovels = webnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

    return (
        <ToonyzCutListComponent webnovels={webnovels} />
    )
}