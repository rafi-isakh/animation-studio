import { ToonyzCutListComponent } from '@/components/ToonyzCutListComponent';

async function getWebnovels() {
    const response = fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_metadata`) // probably should get rid of this function
    const data = (await response).json();
    return data;
}

export default async function Toonyzcut() {
    const webnovels = await getWebnovels();

    return (
        <ToonyzCutListComponent webnovels={webnovels} />
    )
}