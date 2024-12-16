"use client"
import { useState, useEffect } from "react";
import { Webtoon } from "@/components/Types";
import { Button } from "@mui/material";
import Image from "next/image";
import { code_to_lang, phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import moment from "moment";
import { Heart, Share } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import Link from "next/link";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import DictionaryPhrase from "./DictionaryPhrase";




export default function WebtoonInfoAndPictureComponent({ webtoon, coverArt }: { webtoon: Webtoon, coverArt: string }) {
    const { language, dictionary } = useLanguage();
    const formattedDate = moment(webtoon.created_at).format('MM/DD/YYYY hh:mm');
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useUser();
    const [tags, setTags] = useState([]);

    useEffect(() => {
        const tagsJSON = JSON.parse(webtoon.tags);
        setTags(tagsJSON);
    }, [webtoon.tags]);

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
                    <div className="px-4 md:px-0 space-y-2">
                       
                       <ul className="flex flex-row gap-2">
                            {
                                webtoon.genre && (
                                    <li className="text-sm text-gray-500">
                                        <DictionaryPhrase phraseVar={webtoon.genre.toLowerCase()} />
                                        <span style={{
                                                height: '2px',
                                                width: '2px',
                                                backgroundColor: '#bbb',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                marginLeft: '5px',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                alignSelf: 'center'
                                        }} />
                                    </li>
                                )
                            }
                            {/* 무료/프리미엄 */}
                               <li className="text-sm text-gray-500">
                            
                                {phrase(dictionary, "premium", language)}
                               </li>
                        </ul>
                        
                        <OtherTranslateComponent content={webtoon.title} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="title" classParams="text-2xl font-bold" />
                        <p> {webtoon.user.nickname === 'Anonymous' ? '' : webtoon.user.nickname}</p>
                        
                        <ul className="flex flex-row gap-2">
                            {/* {
                                webtoon.genre && (
                                    <li className="text-sm text-black rounded-md px-2 border border-gray-500 hover:bg-[#8A2BE2] transition duration-150 ease-in-out">
                                        <DictionaryPhrase phraseVar={webtoon.genre.toLowerCase()} />
                                    </li>
                                )
                            } */}
                            {tags.map((tag: string, index: number) => (
                                <li key={`tag-${index}`} 
                                    className="text-sm text-black rounded-md px-2 border border-gray-500 hover:bg-[#8A2BE2] transition duration-150 ease-in-out">#{tag}</li>
                            ))}
                               {/* 연령별 태그 */}
                               <li className="text-sm text-black rounded-md bg-green-400 px-2 transition duration-150 ease-in-out self-center text-center">13+</li>
                        </ul>



                        {/* <p className="text-sm text-gray-400">{formattedDate}</p> */}
                        <OtherTranslateComponent content={webtoon.description} elementId={webtoon.id.toString()} elementType='webtoon' elementSubtype="description" classParams="text-sm text-gray-800" />
                       
                        {/* <div className="flex flex-row space-x-4 items-center text-[12px] ">
                              
                                <p className=' flex items-center'>
                                    <i className="fa-regular fa-heart mr-1"></i> {webtoon.upvotes}
                                </p>
                                <p className=' flex items-center'>
                                    <i className="fa-solid fa-eye mr-1"></i> {webtoon.views}
                                </p>
                                <p className=' flex items-center'>
                                    <i className="fa-solid fa-list mr-1"></i>
                        
                                    {webtoon.chapters.length}
                                </p>
                            </div> */}
                        <div className="flex flex-row gap-2 pt-5">
                            {/* button's top padding 5 */}
                            <Button 
                              variant="contained" 
                              disableElevation
                              className="bg-gray-500 hover:bg-[#8A2BE2] text-white rounded-md w-[200px] py-2 transition duration-150 ease-in-out">
                                <Link
                                    href={`/webtoons/${webtoon.id}/001`}
                                    className="text-center flex flex-row items-center"
                                >
                                    {/* Start To Read Episode 1 &gt; */}
                                    {phrase(dictionary, "start_to_read_episode_1", language)}
                                </Link>
                            </Button>

                                <Link
                                    href=''
                                    className="text-center flex justify-center items-center contents-center
                                               group border w-[40px] border-gray-500 hover:border-[#8A2BE2]  hover:bg-[#8A2BE2]
                                             text-white rounded-md transition duration-150 ease-in-out
                                            "
                                           >
                                    <Heart size={20} className="text-gray-500 group-hover:text-white" />
                                    {/* {
                                        likeToggle ?
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-solid fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                            :
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-regular fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                    } */}
                                </Link>
                            
                           
                                <Link
                                    href=''
                                    className="text-center flex justify-center items-center contents-center
                                              group border w-[40px] border-gray-500 hover:border-[#8A2BE2]  hover:bg-[#8A2BE2]
                                            text-white rounded-md transition duration-150 ease-in-out
                                            "
                                            >
                                    <Share size={20} className="text-gray-500 group-hover:text-white" />
                                   
                                </Link>
                        

                        </div>
                    </div>
                </div>

                <div className="w-[270px] h-auto min-h-[350px] order-first md:order-last md:pt-0 pt-5">
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
