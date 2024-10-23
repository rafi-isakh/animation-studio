"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponentSquare from "@/components/WebnovelComponentSquare"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';
import Image from 'next/image';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsListByEditor = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    let genre = searchParams.genre;
    let version = searchParams.version;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])

    useEffect(() => {
        for (const novel of webnovels) {
            if (premium.includes(novel.id)) {
                novel.version = "premium"
            }
            else {
                novel.version = "free"
            }
        }
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item))
            .filter(item => filter_by_version(item))

        setWebnovelsToShow(_webnovelsToShow)
    }, [version, genre])

    let text = '';
    if (sortBy == 'views') {
        text = 'popularWebnovels'
    } else if (sortBy == 'likes') {
        text = 'likedWebnovels'
    } else if (sortBy == 'date') {
        text = 'latestWebnovels'
    }

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    const filter_by_genre = (item: Webnovel) => {
        if (genre == "all" || genre == null) {
            return item;
        }
        else {
            if (genre == item.genre) {
                return item;
            }
        }
    }

    const filter_by_version = (item: Webnovel) => {
        if (version == item.version) {
            return item;
        }
    }

    const sortByFn = (a: Webnovel, b: Webnovel): number => {
        if (sortBy == 'views') {
            return b.views - a.views
        } else if (sortBy == 'likes') {
            return b.upvotes - a.upvotes
        } else if (sortBy == 'date') {
            let latestDateA = new Date(0);
            let latestDateB = new Date(0);
            for (let i = 0; i < a.chapters.length; i++) {
                let dateA = moment(a.chapters[i].created_at).toDate();
                if (dateA > latestDateA) {
                    latestDateA = dateA;
                }
            }
            for (let i = 0; i < b.chapters.length; i++) {
                let dateB = moment(b.chapters[i].created_at).toDate();
                if (dateB > latestDateB) {
                    latestDateB = dateB;
                }
            }
            if (latestDateA > latestDateB) {
                return -1;
            } else if (latestDateA == latestDateB) {
                return 0;
            } else {
                return 1;
            }
        } else {
            return 0;
        }
    }


    return (
        <div className='w-full max-w-screen-xl mx-auto flex flex-col mb-10'>

            <div className='flex flex-col md:flex-row'>
                <div className='md:w-[1/2] py-6 px-3 flex flex-col items-center justify-center '>
                    {/* {(webnovels.length > 0) ?
                        phrase(dictionary, text, language) : <></>
                    } */}

                    <h1 className='text-xl md:text-xl p-2 font-bold'>
                        
                    <Image
                        src="/N_Logo.png"
                        alt="Toonyz Logo"
                        width={0}
                        height={0}
                        sizes="100vh"
                        className=''
                        style={{ 
                            marginTop: '15px',
                            height: '35px', 
                            width: '35px', 
                            justifyContent: 'center', 
                            alignSelf: 'center', 
                            borderRadius: '25%', 
                            border: '1px solid #eee'  
                            }}
                        />    튜니즈 에디터가 핸드 픽업한 작품!
                        
                    </h1>

                    <p className='text-sm'> 튜니즈 에디터가 한땀 한땀 핸드 픽업한 작품들을 만나보세요. </p>
                    <button className='bg-pink-600 text-white font-extrabold px-6 py-3 rounded-xl text-md mt-5'>Explore more</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    {webnovelsToShow
                        .sort(sortByFn)
                        .map((item, index) => (
                            <div className=" " key={index}>
                                <WebnovelComponentSquare webnovel={item} index={index} ranking={true} />
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
};

export default WebnovelsListByEditor;