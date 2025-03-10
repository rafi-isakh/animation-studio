"use client"
import { ToonyzCutListComponent } from '@/components/ToonyzCutListComponent';
import { Webnovel } from '@/components/Types';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { temporarilyUnpublished } from '@/utils/webnovelUtils';
export default function Toonyzcut() {
    let { webnovels } = useWebnovels();
    webnovels = webnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

    return (
        <ToonyzCutListComponent webnovels={webnovels} />
    )
}