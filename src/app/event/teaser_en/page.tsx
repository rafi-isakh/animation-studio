import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import Link from "next/link";

const eventTeaserPage = () => {
    return (
        <div className="pt-10 bg-black dark:bg-black">
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
                <div className="bg-black flex justify-center items-center w-[700px] h-full">
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
                <div className="md:w-[700px] w-full flex flex-col items-center justify-center mx-auto bg-black pb-36 text-center">
                    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSdHqHP8HwrJEzkXuQqK9NWJDjB_gZraCsaTKtGukx7G2XhjGw/viewform?usp=header" target="_blank" className="mx-auto">
                        <Image
                            src="/images/event_teaser/surveyEvent_09.webp"
                            alt="Toonyz Event Teaser"
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
            </div>
        </div>
    )
}

export default eventTeaserPage;