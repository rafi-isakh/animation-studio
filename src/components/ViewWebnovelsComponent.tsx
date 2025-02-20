"use client"
import { Webnovel, Webtoon } from '@/components/Types'
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Button, CircularProgress, ThemeProvider, useMediaQuery } from '@mui/material';
import { grayTheme } from '@/styles/BlackWhiteButtonStyle';
import { createEmailHash } from '@/utils/cryptography'
import Image from 'next/image';
import Link from 'next/link';
import ContentChapterListComponent from './UI/ContentChapterListComponent';
import { useWebnovels } from '@/contexts/WebnovelsContext';
const ViewWebnovelsComponent = ({ searchParams, webnovel, userWebnovels, loadingUsersOtherWebnovels }: {
    searchParams: { [key: string]: string | string[] | undefined },
    webnovel: Webnovel | null, userWebnovels: Webnovel[] | null, loadingUsersOtherWebnovels: boolean
}) => {
    const [webnovelLoading, setWebnovelLoading] = useState(true);
    const [userWebnovelsLoading, setUserWebnovelsLoading] = useState(true);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [atLeastOneWebnovel, setAtLeastOneWebnovel] = useState(false);
    const id = searchParams.id;
    const [refreshKey, setRefreshKey] = useState(0);
    const { language, dictionary, setLanguage } = useLanguage();
    const nickname = webnovel?.user.nickname;
    const author_email = webnovel?.user.email_hash;
    const { email } = useUser();
    const [deletedWebnovelId, setDeletedWebnovelId] = useState<string | undefined>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isMediumScreen = useMediaQuery('(min-width:768px)');
    const [tabValue, setTabValue] = useState('1');
    const [content, setContent] = useState<Webtoon | Webnovel | null>(null);
    const { invalidateCache } = useWebnovels();


    const handleContentUpdate = (updatedContent: Webtoon | Webnovel) => {
        setContent(updatedContent);
    };

    useEffect(() => {
    }, [language])

    // const [chapterId, setChapterId] = useState(0);

    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    if (typeof id === 'string') {
    } else if (Array.isArray(id)) {
        throw new Error("there should be only one id param")
    } else {
    }
    const router = useRouter();

    useEffect(() => {
        let hasWebnovels = false;
        if (webnovel) {
            hasWebnovels = true;
            setWebnovelLoading(false);
        }
        if (userWebnovels && userWebnovels.length > 0) {
            hasWebnovels = true;
            setWebnovels(userWebnovels);
            setUserWebnovelsLoading(false);
        }
        setAtLeastOneWebnovel(hasWebnovels);
    }, [webnovel, userWebnovels, deletedWebnovelId]);

    const isAuthor = (): boolean => {
        // if (!email || !author_email) return false;
        const userEmailHash = createEmailHash(email);
        const authorEmailHash = author_email
        return userEmailHash === authorEmailHash;
    };

    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${id}&novelLanguage=${webnovel?.language}`);
    }

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/delete_webnovel?id=${id}`);
            if (!response.ok) {
                console.error("Delete webnovel failed");
                return;
            }
            invalidateCache();
            // Filter out the deleted webnovel
            const webnovels_after_deletion = webnovels.filter((w: Webnovel) => w.id.toString() != id)
            setWebnovels(webnovels_after_deletion)
            setDeletedWebnovelId(id);
            setShowDeleteModal(false);

            // Navigate to appropriate page
            if (webnovels_after_deletion.length > 0) {
                const ids = webnovels_after_deletion.map((w: Webnovel) => w.id);
                const first = Math.min(...ids);
                await router.push(`/view_webnovels?id=${first.toString()}`);
            } else {
                await router.push('/view_webnovels');
                router.refresh();
            }
        } catch (error) {
            console.error(`Couldn't delete webnovel ${id}`, error)
        }
    }

    const handleAIEditor = () => {
        router.push(`/ai_editor?id=${id}`)
    }

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    if (language === 'ja' && (id == '19' || id == '20')) {
        alert("이 웹소설은 아직 일본어로 서비스되지 않습니다.");
        setLanguage('ko');
    }

    if (id === undefined) {
        return (
            <div className='md:max-w-screen-xl w-full flex flex-row justify-center mx-auto h-screen md:mt-[-96px] mt-[-80px]'>
                <div className="flex flex-col justify-center items-center space-y-2">
                    <Image src="/stelli/stelli_4.svg" alt="noWebnovelsFound" width={150} height={100} />
                    <p className="text-md font-bold"> {phrase(dictionary, "noWebnovelsFound", language)} </p>
                    <p className="text-md"> {phrase(dictionary, "noWebnovelsFound_subtitle", language)} </p>
                    <Button className="bg-[#DB2777] text-md text-white px-4 py-2 rounded-md">
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
                        <div className="md:w-1/3 max-auto w-full flex-grow-0">
                            <div className="md:max-w-[360px] w-full  mx-auto mt-4">
                                <AuthorAndWebnovelsAsideComponent
                                    webnovel={webnovel!}
                                    nickname={nickname}
                                    coverArt={webnovel?.cover_art || ""}
                                    onNewChapter={handleNewChapter}
                                    onDelete={handleDelete}
                                />
                            </div>
                        </div>
                        <div className='flex-1 md:w-2/3 w-full'>
                            <ContentChapterListComponent
                                content={webnovel as Webnovel}
                                coverArt={webnovel?.cover_art || ""}
                                isWebtoon={false}
                                relatedContent={webnovels}
                                onContentUpdate={handleContentUpdate}
                                loadingUsersOtherWebnovels={loadingUsersOtherWebnovels}
                            />
                        </div>
                    </div>
                </div>
            )
        } else {
            return (
                <div className='md:max-w-screen-md w-full flex flex-row justify-center mx-auto h-[80vh]'>
                    <p className='text-lg font-bold'>{phrase(dictionary, "noWebnovelsFound", language)}</p>
                </div>
            )
        }
    }
}

export default ViewWebnovelsComponent;

