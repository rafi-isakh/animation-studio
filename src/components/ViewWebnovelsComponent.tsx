"use client"
import { Webnovel, ToonyzPost } from '@/components/Types'
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Button } from '@/components/shadcnUI/Button'
import Image from 'next/image';
import Link from 'next/link';
import ContentChapterListComponent from './UI/ContentChapterListComponent';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { MoveLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import animationData from '@/assets/N_logo_with_heart.json';
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});

const ViewWebnovelsComponent = ({ webnovel_id, webnovel, userWebnovels, loadingUsersOtherWebnovels, posts }: {
    webnovel_id: string,
    webnovel: Webnovel | null,
    userWebnovels: Webnovel[] | null,
    loadingUsersOtherWebnovels: boolean,
    posts: ToonyzPost[]
}) => {
    const [webnovelLoading, setWebnovelLoading] = useState(true);
    const [userWebnovelsLoading, setUserWebnovelsLoading] = useState(true);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [atLeastOneWebnovel, setAtLeastOneWebnovel] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { language, dictionary, setLanguage } = useLanguage();
    const nickname = webnovel?.author.nickname;
    const [deletedWebnovelId, setDeletedWebnovelId] = useState<string | undefined>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [content, setContent] = useState<Webnovel | null>(null);
    const webnovelLoadingRef = useRef(webnovel ? false : true);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [relatedContent, setRelatedContent] = useState<Webnovel[]>([]);
    const { getWebnovelsMetadataByAuthorId, getWebnovelsMetadataByUserId } = useWebnovels();

    const handleContentUpdate = (updatedContent: Webnovel) => {
        setContent(updatedContent);
    };

    useEffect(() => {
    }, [language])

    // const [chapterId, setChapterId] = useState(0);

    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    const router = useRouter();

    useEffect(() => {
        let hasWebnovels = false;
        if (webnovel) {
            hasWebnovels = true;
        }
        if (userWebnovels && userWebnovels.length > 0) {
            hasWebnovels = true;
            setWebnovels(userWebnovels);
            setUserWebnovelsLoading(false);
        }
        setAtLeastOneWebnovel(hasWebnovels);
        webnovelLoadingRef.current = false;
    }, [webnovel, userWebnovels, deletedWebnovelId]);


    useEffect(() => {
        const fetchRelatedContent = async () => {
            // webnovel.premium is false when the webnovel is a community webnovel
            if (!webnovel?.premium && webnovel?.user?.id) {
                const webnovels = await getWebnovelsMetadataByUserId(webnovel.user.id.toString());
                setRelatedContent(webnovels.filter((w: Webnovel) => w.id.toString() != webnovel_id));
            } else if (webnovel?.premium && webnovel?.author?.id) {
                const webnovels = await getWebnovelsMetadataByAuthorId(webnovel.author.id.toString());
                setRelatedContent(webnovels);
            }
        }
        fetchRelatedContent();
    }, [webnovel?.author.id]);


    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${webnovel_id}&novelLanguage=${webnovel?.language}`);
    }

    const handleDelete = async () => {
        try {
            setLoadingDelete(true);
            const response = await fetch(`/api/delete_webnovel?id=${webnovel_id}`);
            if (!response.ok) {
                console.error("Delete webnovel failed");
                setLoadingDelete(false);
                return;
            }
            // Filter out the deleted webnovel
            const webnovelsAfterDeletion = webnovels.filter((w: Webnovel) => w.id.toString() != webnovel_id)
            setWebnovels(webnovelsAfterDeletion)
            setDeletedWebnovelId(webnovel_id);
            setShowDeleteModal(false);

            // Navigate to appropriate page
            if (webnovelsAfterDeletion.length > 0) {
                const ids = webnovelsAfterDeletion.map((w: Webnovel) => w.id);
                const first = Math.min(...ids);
                router.push(`/view_webnovels/${first.toString()}`);
            } else {
                router.push('/view_webnovels');
                router.refresh();
            }
            setLoadingDelete(false);
        } catch (error) {
            console.error(`Couldn't delete webnovel ${webnovel_id}`, error)
        }
    }

    const handleAIEditor = () => {
        router.push(`/ai_editor?id=${webnovel_id}`)
    }

    if (language === 'ja' && (webnovel_id == '19' || webnovel_id == '20')) {
        alert("이 웹소설은 아직 일본어로 서비스되지 않습니다.");
        setLanguage('ko');
    }

    if (webnovel_id === undefined) {
        return (
            <div className='md:max-w-screen-xl w-full flex flex-row justify-center mx-auto h-screen md:mt-[-96px] mt-[-80px]'>
                <div className="flex flex-col justify-center items-center space-y-2">
                    <Image src="/stelli/stelli_4.svg" alt="noWebnovelsFound" width={150} height={100} />
                    <p className="text-md font-bold"> {phrase(dictionary, "noWebnovelsFound", language)} </p>
                    <p className="text-md"> {phrase(dictionary, "noWebnovelsFound_subtitle", language)} </p>
                    <Button variant="default" className="bg-[#DB2777] text-md text-white px-4 py-2 rounded-md">
                        <Link href="/new_webnovel">
                            {phrase(dictionary, "writeYourStory", language)}
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }
    else {
        if (atLeastOneWebnovel) {
            return (
                <div className='md:max-w-screen-xl mx-auto w-full min-h-screen'>
                    <div className="flex md:flex-row flex-col justify-between items-start">
                        <div className="md:w-1/3 mx-auto w-full flex-grow-0 flex-shrink-0">
                            <div className="md:max-w-[360px] w-full mx-auto ">
                                <Link href="/" className={`items-center gap-1 text-black dark:text-white hover:text-gray-700 transition-colors mb-4 ml-2 self-start flex md:hidden z-[999]`}>
                                    <MoveLeft size={20} className='dark:text-white text-black ' />
                                    <p className="text-sm font-base">Back</p>
                                </Link>
                                <AuthorAndWebnovelsAsideComponent
                                    webnovel={webnovel!}
                                    nickname={nickname}
                                    relatedContent={webnovels}
                                    coverArt={webnovel?.cover_art || ""}
                                    onNewChapter={handleNewChapter}
                                    onDelete={handleDelete}
                                    loadingDelete={loadingDelete}
                                />

                            </div>
                        </div>
                        <div className='flex-1 w-full md:w-2/3'>
                            <ContentChapterListComponent
                                content={webnovel as Webnovel}
                                relatedContent={relatedContent}
                                onContentUpdate={handleContentUpdate}
                                posts={posts}
                                onNewChapter={handleNewChapter}
                            />
                        </div>
                    </div>
                </div>
            )
        } else {
            if (webnovelLoadingRef.current) {
                return (
                    <div role="status" className={`flex items-center justify-center min-h-screen`}>
                        <LottieLoader
                            animationData={animationData}
                            width="w-40"
                            centered={true}
                            pulseEffect={true}
                        />
                    </div>
                )
            }
        }
    }
}

export default ViewWebnovelsComponent;

