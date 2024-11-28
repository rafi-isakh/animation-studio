"use client"
import { useState, useEffect } from "react";
import { Webtoon } from "@/components/Types";
import Image from "next/image"; 
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import moment from "moment";
import { Heart } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import Link from "next/link";


export default function WebtoonInfoAndPictureComponent({ webtoon, coverArt }: { webtoon: Webtoon, coverArt: string }) {
    const { language, dictionary } = useLanguage();
    const formattedDate = moment(webtoon.created_at).format('MM/DD/YYYY hh:mm');
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useUser();


    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/get_upvoted_chapters?email=${email}`);
            const data = await response.json();
            console.log(data);
            if (data.includes(id)) {
                setLikeToggle(true);
            }
        }
        if (email) {
            fetchData();
        }
    }, [email])

    useEffect(() => { // upvotes
        fetch(`/api/get_chapter_by_id?id=${webtoon.id}`)
            .then(response => response.json())
            .then(data => {
                // setChapter(data);
                setUpvotes(data.upvotes)
                fetch(`/api/get_webnovel_by_id?id=${data.webtoon_id}`)
                    .then(response2 => response2.json())
                    .then(data2 => {
                        setWebtoon(data2)
                    })
            }
            )
    }, []);




    return (
        <div className="relative flex flex-col md:h-[439px] h-auto justify-center items-center">
        {/* Blurred background */}
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-10 backdrop-blur-[300px]"
            style={{ 
                backgroundImage: `url(${coverArt})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        />
        
        {/* Existing content container */}
        <div className="relative z-10 flex md:flex-row flex-col justify-evenly items-center md:h-[439px] h-auto space-y-1 bg-[#929292]/10 w-full">
         
            <div className="flex flex-col gap-2 p-10 w-[450px]">
                <div className="px-5 md:px-0 space-y-2">
                    <span className="text-sm text-gray-400">Genre</span>
                    <h1 className="text-2xl font-bold">{webtoon.title}</h1>
                    <p>{webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname }</p>
                    <ul className="flex flex-row gap-2">
                        <li className="text-sm text-gray-100 rounded-xl px-2 py-1 bg-pink-600">#hashtag</li>
                        <li className="text-sm text-gray-100 rounded-xl px-2 py-1 bg-pink-600">#hashtag</li>
                        <li className="text-sm text-gray-100 rounded-xl px-2 py-1 bg-pink-600">#Genre</li>
                    </ul>
                    <p className="text-sm text-gray-400">{formattedDate}</p>
                    <p className="text-sm text-gray-400 mb-5">
                         {webtoon.description}
                    </p>
            
                    <div className="flex flex-row gap-2">
                        <button className="bg-pink-600 hover:bg-pink-800 text-white rounded-md px-10 py-2 transition duration-150 ease-in-out">
                            {/* Start To Read Episode 1 &gt; */}
                            {phrase(dictionary, "start_to_read_episode_1", language)}
                        </button>

                        <button className="group border-2 px-10 py-2 border-pink-600 hover:border-pink-800  hover:bg-pink-800 text-white rounded-md px-2 transition duration-150 ease-in-out">
                                <Link
                                    href=''
                                    className="text-center flex flex-row items-center "
                                >
                                    <Heart size={22} className="text-pink-600 group-hover:text-white"/> 
                                    {/* {
                                                likeToggle ?
                                                    <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-solid fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                                    :
                                                    <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-regular fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                    } */}
                                </Link>
                        </button>
                        
                                   
                                   
                              


                    </div>
                </div>
            </div>

            <div className="w-[270px] md:h-[350px] h-auto min-h-[350px] order-first md:order-last md:pt-0 pt-5"> 
                <Image 
                    src={coverArt} 
                    alt={webtoon.title} 
                    width={270} 
                    height={350}
                    className="object-cover w-full h-full"
                />
            </div>
        </div>
    </div>
    )
}   
