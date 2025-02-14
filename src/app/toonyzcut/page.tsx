import { ToonyzCutListComponent } from '@/components/ToonyzCutListComponent';
import { Webnovel } from '@/components/Types';

async function getWebnovels() {
    const response = fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_metadata`) // probably should get rid of this function
    const data = (await response).json();
    return data;
}

export default async function Toonyzcut() {
    let webnovels = await getWebnovels();
    const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];
    webnovels = webnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

    return (
        <ToonyzCutListComponent webnovels={webnovels} />
    )
}