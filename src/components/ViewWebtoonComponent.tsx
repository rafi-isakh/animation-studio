import { getSignedUrlForWebtoonImage, listObjectsInWebtoonsDirectory } from "@/utils/s3"
import { getImageDimensions } from "@/utils/imageDimensions"
import WebtoonImageComponent from "@/components/WebtoonImageComponent"
import ViewWebtoonChapterComponent from "@/components/ViewWebtoonChapterComponent"
import { WebtoonImage } from "@/components/Types"

const imagesCache: { [key: string]: WebtoonImage } = {}

const getWebtoonById = async (id: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_by_id?id=${id}`,
        {
            cache: "no-store"
        }
    )
    return await response.json()
}

const ViewWebtoonComponent = async (props: { webtoonId: string, episode: string }) => {
    const webtoon = await getWebtoonById(props.webtoonId)
    const files = await listObjectsInWebtoonsDirectory(`${webtoon.root_directory}/${props.episode}`)
    const images: WebtoonImage[] = []
    const before = performance.now()
    for (const file of files) {
        if (!file) continue;
        const cachedFile = imagesCache[file]
        if (cachedFile) {
            images.push(cachedFile)
            continue;
        }
        const signedUrl = await getSignedUrlForWebtoonImage(file)
        const image = { url: signedUrl }
        images.push(image)
        imagesCache[file] = image;
    }
    const after = performance.now()
    console.log(`for loop took ${after - before}ms`)

    return (
        <ViewWebtoonChapterComponent images={images} episodeNumber={props.episode} webtoon={webtoon} />
    )
}

export default ViewWebtoonComponent;