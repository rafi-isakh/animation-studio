import { getSignedUrlForWebtoonImage, listObjectsInWebtoonsDirectory } from "@/utils/s3"
import { getImageDimensions } from "@/utils/imageDimensions"
import WebtoonImageComponent from "@/components/WebtoonImageComponent"

interface WebtoonImage {
    url: string;
    width: number;
    height: number;
}

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
    for (const file of files) {
        if (!file) continue;
        const cachedFile = imagesCache[file]
        if (cachedFile) {
            images.push(cachedFile)
            continue;
        }
        const signedUrl = await getSignedUrlForWebtoonImage(file)
        const { width, height } = await getImageDimensions(signedUrl)
        const image = { url: signedUrl, width: width!, height: height! }
        images.push(image)
        imagesCache[file] = image;
    }

    return (
        <div className="flex flex-col justify-center items-center mx-auto w-[720px]">
            {images.map((image, index) =>
                <div key={`webtoon-${index}`}>
                    <WebtoonImageComponent image={image.url} width={image.width!} height={image.height!} />
                </div>
            )
            }
        </div>
    )
}

export default ViewWebtoonComponent;