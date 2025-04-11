'use client'
import { phrase } from '@/utils/phrases'
import { ToonyzPost } from '@/components/Types'
import { useLanguage } from '@/contexts/LanguageContext'
import { getImageUrl, getVideoUrl } from '@/utils/urls'
import Image from 'next/image'
import { useState, useRef } from 'react'
import CardsScroll from '@/components/CardsScroll';
import { Card } from '@/components/shadcnUI/Card'
import { useMediaQuery } from '@mui/material'
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import Link from 'next/link'

const ToonyzPostCardList = ({ posts }: { posts: ToonyzPost[] }) => {
    const { dictionary, language } = useLanguage()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const isMobile = useMediaQuery('(max-width: 768px)')

    const renderItem = (item: ToonyzPost, index: number) => {
        return (
            <Link href={`/toonyz_posts/${item.id}`} className="block w-full">
                <div className="relative flex flex-col items-center w-full">
                    <div className="relative shrink-0 overflow-hidden rounded-xl h-full w-full aspect-[180/257] ">
                        {/* Image with hover effect */}
                        <div className="absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out hover:scale-105">
                            {item.image ? <Image
                                src={getImageUrl(item.image)}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 180px, 257px, 100vw"
                                quality={85}
                                className='object-cover '
                                placeholder="blur"
                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                            />
                                : item.video ? <video src={getVideoUrl(item.video)} className='w-full h-full object-cover' /> : <></>}

                            {/* Overlay for hover effect */}
                            <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 hover:opacity-50 flex items-center justify-center gap-2 z-10">
                                <p className="text-white text-center text-sm">{phrase(dictionary, "viewnow", language)}</p>
                                <div className="bg-white rounded-full p-1">
                                    <svg width="10" height="10" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1 1L15 10L1 19V1Z"
                                            fill="black"
                                            stroke="black"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content Container */}
                    <div className="mt-2 w-full">
                        <div className="flex flex-col items-center text-center">
                            {/* Title */}
                           { item.title ? <OtherTranslateComponent
                                content={item.title}
                                elementId={item.id.toString()}
                                elementType="toonyz_post"
                                elementSubtype="title"
                                classParams="text-sm md:text-base font-medium line-clamp-2 w-[100px] md:w-[160px] break-keep korean"
                            /> : <p className='text-sm md:text-base font-medium line-clamp-2 w-[100px] md:w-[160px] break-keep korean'>
                                {"post " + item.id.toString()}
                                </p>}
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <div className={`relative w-full group`}>
            <div>
                <h1 className="flex flex-row justify-between text-xl font-extrabold md:mb-0 mb-3">
                    {phrase(dictionary, "ToonyzPost", language)}
                </h1>

                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div
                        ref={scrollRef}
                        className="hidden md:grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1 py-8"
                    >
                        {posts.length === 0 ? (
                            <p className='text-base text-gray-500'>
                                {phrase(dictionary, "noPosts", language)}
                            </p>
                        ) : (
                            <>
                                {posts.map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        className="flex-shrink-0 w-[160px] relative"
                                        style={{
                                            transformOrigin: "center center",
                                            zIndex: activeIndex === index ? 10 : 1,
                                        }}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        <Card className={`bg-transparent overflow-hidden transition-all duration-300 ease-out border-none shadow-none 
                                                         ${activeIndex === index ? "shadow-none scale-110" : ""}`}
                                        >
                                            {renderItem(item, index)}
                                        </Card>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1">
                        {posts.map((item, index) => (
                            <div key={item.id || index} className="flex-none">
                                {renderItem(item, index)}
                            </div>
                        ))}
                    </div>

                    {!isMobile && <CardsScroll scrollRef={scrollRef} />}
                </div>
            </div>
        </div>
    )
}
export default ToonyzPostCardList