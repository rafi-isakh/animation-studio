"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
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
        <div className='w-full max-w-screen-xl mx-auto flex flex-col'>
            <div className='text-2xl md:text-4xl p-2 font-bold'>
                {(webnovels.length > 0) ?
                    phrase(dictionary, text, language) : <></>
                }
            </div>
            <div className="grid grid-rows-3 md:grid-flow-col gap-2">
                {webnovelsToShow
                    .sort(sortByFn)
                    .map((item, index) => (
                        <div className="" key={index}>
                            <WebnovelComponent webnovel={item} index={index} ranking={true} />
                        </div>
                    ))}
            </div>
        </div>
    )
};

export default WebnovelsList;