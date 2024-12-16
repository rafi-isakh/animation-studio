import { getSignedUrlForWebtoonImage, listObjectsInWebtoonsDirectory } from "@/utils/s3"
import { getImageDimensions } from "@/utils/imageDimensions"
import WebtoonImageComponent from "@/components/WebtoonImageComponent"
import ViewWebtoonChapterComponent from "@/components/ViewWebtoonChapterComponent"
import { Webtoon, WebtoonImage } from "@/components/Types"

const imagesCache: { [key: string]: WebtoonImage } = {}

const ViewWebtoonComponent = async ({ webtoon, episode }: { webtoon: Webtoon, episode: string }) => {
    const files = await listObjectsInWebtoonsDirectory(`${webtoon.root_directory}/${episode}`)
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
        <ViewWebtoonChapterComponent images={images} episodeNumber={episode} webtoon={webtoon} />
    )
}

export default ViewWebtoonComponent;