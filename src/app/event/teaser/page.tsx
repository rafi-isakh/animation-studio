import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import Link from "next/link";


const images = [
    {
        src: "/images/event_teaser/01_ko.webp",
        alt: "Toonyz Event Teaser 01",
        width: 700,
        height: 1996
    },
    {
        src: "/images/event_teaser/02_ko.webp",
        alt: "Toonyz Event Teaser 02",
        width: 700,
        height: 1680
    },
    {
        src: "/images/event_teaser/03_ko.webp",
        alt: "Toonyz Event Teaser 03",
        width: 700,
        height: 1680
    },
    {
        src: "/images/event_teaser/04_ko.webp",
        alt: "Toonyz Event Teaser 04",
        width: 700,
        height: 550
    },
    {
        src: "/images/event_teaser/05_ko.webp",
        alt: "Toonyz Event Teaser 05",
        width: 700,
        height: 550
    },
    {
        src: "/images/event_teaser/06_ko.webp",
        alt: "Toonyz Event Teaser 06",
        width: 700,
        height: 550
    },
    {
        src: "/images/event_teaser/07_ko.webp",
        alt: "Toonyz Event Teaser 07",
        width: 700,
        height: 550
    },
    {
        src: "/images/event_teaser/08_ko.webp",
        alt: "Toonyz Event Teaser 08",
        width: 500,
        height: 100
    }
]

const eventTeaserPage = () => {
    return (
        <div className="bg-black dark:bg-black">
            <div className="flex flex-col items-center justify-center w-full h-full mx-auto">
                <Link href="#" className="mx-auto">
                    <Image
                        src="/images/event_teaser/01_ko.webp"
                        alt="Toonyz Event Teaser"
                        width={700}
                        height={1996}
                        className=""
                        priority
                        quality={100}
                        unoptimized={true}
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </Link>
                {/* https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/Event_video_teaser_0819.mp4 */}
                <div className="bg-black flex justify-center items-center md:w-[700px] w-full h-full">
                    <video
                        src={getImageUrl("Event_video_teaser_0819.mp4")}
                        autoPlay muted loop playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
                {images.map((image, index) => {
                    if (index === 7) {
                        return (
                            <div key={7} className="md:w-[700px] w-full flex flex-col items-center justify-center mx-auto bg-black pb-36 text-center">
                                <Link href="https://docs.google.com/forms/d/e/1FAIpQLSdHqHP8HwrJEzkXuQqK9NWJDjB_gZraCsaTKtGukx7G2XhjGw/viewform?usp=header" target="_blank" className="mx-auto">
                                    <Image
                                        src="/images/event_teaser/08_ko.webp"
                                        alt="Toonyz Event Teaser Submit Button"
                                        width={500}
                                        height={100}
                                        className=""
                                        priority
                                        quality={100}
                                        unoptimized={true}
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Link>
                            </div>
                        )
                    }
                    return (
                        <Image
                            key={index}
                            src={image.src}
                            alt={image.alt}
                            width={image.width}
                            height={image.height}
                                className=""
                                priority
                                quality={100}
                                unoptimized={true}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        )
                    })}
            </div>
        </div>
    )
}

export default eventTeaserPage;