"use client";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EventTeaserPage = () => {
    const router = useRouter();
    return (
        <div className="pt-28 bg-black dark:bg-black pb-36">
            <div className="flex flex-col items-center justify-center w-full h-full mx-auto">
                <Link href="#" className="mx-auto">
                    <Image
                        src="/images/event_teaser/surveyEvent_01.webp"
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
                <Image
                    src="/images/event_teaser/surveyEvent_02.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={1680}
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
                <Image
                    src="/images/event_teaser/surveyEvent_03.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={1680}
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
                <Image
                    src="/images/event_teaser/surveyEvent_04.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={550}
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
                <Image
                    src="/images/event_teaser/surveyEvent_05.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={550}
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
                <Image
                    src="/images/event_teaser/surveyEvent_06.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={550}
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
                <Image
                    src="/images/event_teaser/surveyEvent_07.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={550}
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
                <Image
                    src="/images/event_teaser/surveyEvent_08.webp"
                    alt="Toonyz Event Teaser"
                    width={700}
                    height={550}
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
                <div className="fixed left-0 w-full flex flex-col items-center justify-center z-50 bottom-20 md:bottom-6"> 
                    <button onClick={() => router.push("/event/questionaire")} >
                        
                        {/* Radial shadow behind the image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[400px] h-[24px] rounded-full blur-2xl opacity-100
                                bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
                            </div>
                        </div>

                        <Image
                            src="/images/event_teaser/floatingBtn02.webp"
                            alt="Toonyz Event Teaser"
                            width={300}
                            height={50}
                            priority
                            quality={100}
                            unoptimized
                            className="w-[220px] md:w-[260px] h-auto object-contain relative" 
                        />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EventTeaserPage;