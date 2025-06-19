'use client'
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/shadcnUI/Button";
import { Skeleton } from "@mui/material";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/shadcnUI/Tabs"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Webnovel, Chapter, ToonyzPost } from "@/components/Types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/shadcnUI/Avatar";
import { MessageCircle, AlignLeft, ChevronRightIcon, PenLine, MailQuestion } from "lucide-react";
import Image from "next/image";
import moment from "moment";
import { CommentList } from "@/components/CommentList";
import ListOfChaptersComponent from "@/components/ListOfChaptersComponent";
import AuthorWorkListComponent from "@/components/AuthorWorkListComponent";
import ToonyzPostCard from '@/components/UI/ToonyzPostCard';
import { useUser } from '@/contexts/UserContext';
import { createEmailHash } from '@/utils/cryptography';
import UploadNewChapterButton from "@/components/UI/UploadNewChapterButton";
import Link from "next/link";
import { useMediaQuery } from "@mui/material";
import { getImageUrl } from "@/utils/urls";
import MyLibraryToonyzPostCard from "@/components/UI/MyLibraryToonyzPostCard";
import AskAuthorPageWrapper from "./AskAuthorPageWrapper";
import { koreanToEnglishAuthorName } from "@/utils/webnovelUtils";
import ActiveUserAvatar from "./ActiveUserAvatar";

interface ContentChapterListComponentProps {
    content: Webnovel;
    relatedContent?: Webnovel[];
    onContentUpdate?: (updatedContent: Webnovel) => void;
    posts?: ToonyzPost[];
    onNewChapter?: () => void;
}

const ContentChapterListComponent: React.FC<ContentChapterListComponentProps> = ({
    content,
    relatedContent = [],
    onContentUpdate,
    posts = [],
    onNewChapter
}) => {

    const [tabValue, setTabValue] = useState('1');
    const { dictionary, language } = useLanguage();
    const [currentPageUrl, setCurrentPageUrl] = useState('');
    const [isAuthor, setIsAuthor] = useState(false);
    const { id, email, nickname } = useUser();

    const formattedDate = content?.created_at
        ? moment(new Date(content.created_at)).format('MM/DD/YYYY')
        : '';


    const chapterCount = content?.chapters_length || 0;
    const postCount = posts?.length || 0;
    const isMobile = useMediaQuery('(max-width: 768px)');

    // const isAuthor = (): boolean => {
    //     return id === content.user.id.toString()
    // };

    const view_profile_href = content.user.email_hash == content.author.email_hash ?
        `/view_profile/${content.user.id}` : `/view_author/${content.author.id}`;


    useEffect(() => {
        // setup author status
        if (email && content?.user?.email_hash) {
            const userEmailHash = createEmailHash(email);
            if (content.user.email_hash === userEmailHash) {
                setIsAuthor(true);
            }
        }
    }, [email, content])


    return (
        <div className="flex flex-col w-full ">
            <Tabs value={tabValue} defaultValue="1" className="w-full" onValueChange={(value) => { setTabValue(value) }}>
                <TabsList className='bg-white dark:bg-black md:pt-4 pt-0 md:p-0 p-4 gap-4'>
                    <TabsTrigger value="1" onClick={() => { setTabValue('1') }} className="data-[state=active]:bg-[#DB2777] data-[state=active]:text-white rounded-lg px-4 py-2 w-full">
                        <span className="flex flex-row items-center gap-1 text-sm">
                            <AlignLeft size={16} />
                            {phrase(dictionary, "episodes", language)}{' '}
                            {chapterCount}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="2" onClick={() => { setTabValue('2') }} className="data-[state=active]:bg-[#DB2777] data-[state=active]:text-white rounded-lg px-4 py-2 w-full" >
                        <span className="flex flex-row items-center gap-1 text-sm">
                            <MessageCircle size={16} />
                            {phrase(dictionary, "post", language)}{' '}
                            {postCount}
                        </span>
                    </TabsTrigger>
                    {/* <TabsTrigger value="3" onClick={() => { setTabValue('3') }} className="data-[state=active]:bg-[#DB2777] data-[state=active]:text-white rounded-lg px-4 py-2 w-full" >
                        <span className="flex flex-row items-center gap-1 text-sm">
                            <MailQuestion size={16} />
                            {phrase(dictionary, "askToAuthor", language)}{''}
                        </span>
                    </TabsTrigger> */}
                </TabsList>
                <TabsContent value="1">
                    <div className="flex flex-col self-start justify-start">
                        <div className="flex flex-col w-full gap-3">
                            {content && content.chapters ? (
                                content.chapters.length > 0 ? (
                                    <div className="flex md:flex-row flex-col w-full gap-2 justify-between ">
                                        <div className="flex flex-col gap-2 w-full flex-shrink-0 flex-grow-0 md:p-0 p-4">
                                            <div className="flex flex-col gap-2 flex-shrink-0 flex-grow-0 w-full">
                                                <ListOfChaptersComponent
                                                    webnovel={content as Webnovel}
                                                    onUpdate={onContentUpdate as (updatedContent: Webnovel) => void}
                                                />
                                            </div>
                                        </div>                                      
                                    </div>
                                ) : (
                                    <div className="flex justify-center items-center w-full min-h-72 gap-2">
                                        <div className="flex flex-col justify-center items-center gap-4">
                                            <Image src="/stelli/stelli_3.png" alt="noWebnovelsFound" width={150} height={100} />
                                            <p className="pt-3 text-md font-bold"> {phrase(dictionary, "noChaptersAvailable", language)} </p>
                                            <p className="text-gray-500 text-sm">{phrase(dictionary, "writeNewChapter", language)}</p>
                                            <UploadNewChapterButton onNewChapter={onNewChapter} />
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col w-full gap-2">
                                    <Skeleton variant="rectangular" height={40} width="85%" />
                                    <Skeleton variant="rectangular" height={40} width="85%" />
                                    <Skeleton variant="rectangular" height={40} width="85%" />
                                </div>
                            )}
                            {/* author's other work list */}
                            {content && content.user && relatedContent && relatedContent.length > 0 ? (
                                id !== content.user.id.toString() ? (
                                    <div className="flex flex-col justify-start min-w-[300px] w-full md:pt-10 pt-0">
                                        <div className="flex flex-row justify-between items-center text-base font-bold text-left md:px-0 px-4">
                                            <p> {phrase(dictionary, "authorWorkList", language)} </p>
                                            {/* <p className="text-gray-600 text-[10px] flex-shrink-0 ">
                                                {phrase(dictionary, "view_webnovels_learnMore", language)}
                                            </p> */}
                                        </div>
                                        <div className="relative flex w-full overflow-hidden no-scrollbar md:p-0 p-4">
                                            <AuthorWorkListComponent
                                                webnovels={relatedContent as Webnovel[]}
                                                nickname={content.user.nickname}
                                            />
                                        </div>
                                    </div>
                                ) : (<></>)
                            ) : (
                                <div className="flex flex-row gap-2">
                                    <Skeleton variant="rectangular" height={200} width={150} />
                                    <Skeleton variant="rectangular" height={200} width={150} />
                                    <Skeleton variant="rectangular" height={200} width={150} />
                                </div>
                            )}

                            <div className="flex flex-col w-full gap-2 overflow-y-auto md:p-0 p-4 md:pt-10 pt-0">
                                {posts && posts.length > 0 && (
                                    <>
                                        <h2 className="text-base font-bold text-left mb-1">
                                            {phrase(dictionary, "relatedToonyzPosts", language)}
                                        </h2>
                                        <MyLibraryToonyzPostCard toonyzPosts={posts} webnovel_id={content.id} mode="view_webnovels" />
                                    </>
                                )}
                            </div>

                            {content && content.chapters && content.chapters_length > 0 ? (
                                <CommentList
                                    content={content}
                                    chapter={content.chapters[0] as Chapter}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <p className="text-gray-500 text-sm">
                                        {phrase(dictionary, "noComments", language)}
                                    </p>
                                    <div className="h-[10vh]" />
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="2" >
                    <div className="flex flex-col self-start justify-start gap-4 space-y-4">
                        {posts && posts.length > 0 ? (
                            <div>
                                {posts.map((post, index) => (
                                    <div key={index} className="flex flex-col mb-4">
                                        <ToonyzPostCard post={post} webnovel={content as Webnovel} email={email} user={post.user} />
                                    </div>
                                ))}

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 h-[50vh]">
                                <p className="text-gray-500 text-sm">
                                    {phrase(dictionary, "noPosts", language)}
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
                {/* <TabsContent value="3">
                    <div className="flex flex-col self-start justify-start gap-4 space-y-4 h-[20vh]">
                        <AskAuthorPageWrapper author={content.user} content={content} />
                    </div>
                </TabsContent> */}
            </Tabs>
        </div>
    );
};

export default ContentChapterListComponent;