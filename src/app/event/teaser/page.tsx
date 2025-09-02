import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import Link from "next/link";


const images = [
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
        <div className="bg-black dark:bg-black pb-36">
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
                    if (index === 6) {
                        return (
                            <div key={6}   className="fixed left-0 w-full flex flex-col items-center justify-center z-50 bottom-20 md:bottom-6"> 
                                <Link
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSf4BOIGXC2Xu3T3WSOhEXpOoFuAY3L1SUQXBCAgyLDAlcCWxw/viewform?usp=sharing&ouid=116407487776789966088"
                                    target="_blank"
                                    className="relative mx-auto"
                                >
                                    {/* Radial shadow behind the image */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[400px] h-[24px] rounded-full blur-2xl opacity-100
                                            bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500">
                                        </div>
                                    </div>

                                    <Image
                                        src="/images/event_teaser/floatingBtn.webp"
                                        alt="Toonyz Event Teaser"
                                        width={300}
                                        height={50}
                                        priority
                                        quality={100}
                                        unoptimized
                                        className="w-[220px] md:w-[260px] h-auto object-contain relative" 
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