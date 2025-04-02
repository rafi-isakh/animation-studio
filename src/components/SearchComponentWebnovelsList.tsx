"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from "@/components/shadcnUI/Card"
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/shadcnUI/Carousel"
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { sortByFn } from '@/utils/webnovelUtils';
import { Link, useMediaQuery } from '@mui/material';
import { calculateIndex } from '@/utils/webnovelUtils';
import _ from 'lodash';
import Image from 'next/image';
import { getImageUrl } from '@/utils/urls';
import Autoplay from "embla-carousel-autoplay"
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { Heart } from 'lucide-react';

const SearchComponentWebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const [columns, setColumns] = useState<Webnovel[][]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const [mobileGrid, setMobileGrid] = useState('');
    // const chunkedItems = _.chunk(webnovels, 3);
    const chunkedItems = _.chunk(webnovelsToShow.length > 0 ? webnovelsToShow : webnovels, 3);
    const [currentIndex, setCurrentIndex] = useState(0);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)


    useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    useEffect(() => {
        const _webnovelsToShow = webnovels
            .sort((a, b) => sortByFn(a, b, sortBy));

        setWebnovelsToShow(_webnovelsToShow);

    }, [version, genre, sortBy, webnovels]);




    const text = sortBy === 'views' ? 'popularWebnovels' :
        sortBy === 'likes' ? 'likedWebnovels' :
            sortBy === 'date' ? 'latestWebnovels' : '';

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    }

    return (
        <div className='relative w-full  mx-auto group font-pretendard'>
            <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                <span className='text-black dark:text-white'>
                    {phrase(dictionary, "YouMightLike", language)}
                </span>
            </h1>
            <Carousel
                setApi={setApi}
            >
                <CarouselContent className="-ml-0">
                    {webnovelsToShow.map((webnovel, index) => (
                        <CarouselItem key={`${webnovel}-${index}`} className="md:basis-1/3 lg:basis-1/3 " >
                            <Link href={`/view_webnovels/${webnovel.id}`} className="!no-underline p-0 m-0">
                                <Card className='h-[150px] p-0 m-0 border'>
                                    <CardContent className="h-full flex flex-row items-center justify-start rounded-lg p-0 m-0 overflow-hidden"
                                    // style={{
                                    //     backgroundImage: `url(${getImageUrl(webnovel.cover_art)})`,
                                    //     backgroundSize: 'cover',
                                    //     backgroundPosition: 'top',
                                    // }}
                                    >
                                        <Image src={getImageUrl(webnovel.cover_art)} alt={webnovel.title} width={120} height={180} />
                                        <div className="p-2">
                                            <div className="flex-grow overflow-hidden self-center">
                                                {/* Genre & Title */}
                                                <OtherTranslateComponent
                                                    content={webnovel.title}
                                                    elementId={webnovel.id.toString()}
                                                    elementType='webnovel'
                                                    elementSubtype="title"
                                                    classParams={language === 'ko' ? "text-md md:text-base w-full break-keep korean" : "text-md md:text-base w-full break-words"}
                                                />
                                                <div className="flex flex-col">
                                                    <p className="text-[10px] md:text-sm font-bold w-full truncate text-gray-500">
                                                        {webnovel.author.nickname} • {phrase(dictionary, webnovel.genre, language)}
                                                    </p>
                                                    {/* total chapters and num chapters */}
                                                    <div className="flex flex-row gap-1 text-[10px] md:text-sm text-gray-500 font-bold dark:text-gray-500 ">
                                                        <p> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters_length} {phrase(dictionary, "numchapters", language)}</p>
                                                        <p className="flex flex-row gap-1 items-center text-gray-500 dark:text-gray-500">
                                                            <Heart size={12} />
                                                            {webnovel.upvotes}
                                                        </p>
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="absolute -top-10 right-0 flex items-center justify-end gap-2">
                    <CarouselPrevious className="static transform-none text-black dark:text-white" />
                    <span className="text-sm text-muted-foreground">
                        {current} / {webnovelsToShow.length}
                    </span>
                    <CarouselNext className="static transform-none text-black dark:text-white" />
                </div>
            </Carousel>

        </div>
    )
};

export default SearchComponentWebnovelsList;