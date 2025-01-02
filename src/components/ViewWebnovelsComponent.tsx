"use client"
import { Webnovel } from '@/components/Types'
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from '@/components/WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from '@/components/ListOfChaptersComponent';
import { useUser } from '@/contexts/UserContext';
import '@/styles/globals.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Box, Button, CircularProgress, Modal, ThemeProvider, useMediaQuery } from '@mui/material';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { grayTheme, NoCapsButton } from '@/styles/BlackWhiteButtonStyle';
import { useModalStyle } from '@/styles/ModalStyles';
import { ChevronLeft, PenLine, Trash } from 'lucide-react';
import { ListOfChapterComments } from '@/components/ListOfChapterComments';
import { createEmailHash } from '@/utils/cryptography'
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_loader.json'

const ViewWebnovelsComponent = ({ searchParams, webnovel, userWebnovels }: {
    searchParams: { [key: string]: string | string[] | undefined },
    webnovel: Webnovel | null, userWebnovels: Webnovel[] | null
}) => {
    const [webnovelLoading, setWebnovelLoading] = useState(true);
    const [userWebnovelsLoading, setUserWebnovelsLoading] = useState(true);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [atLeastOneWebnovel, setAtLeastOneWebnovel] = useState(false);
    const id = searchParams.id;
    const [refreshKey, setRefreshKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const nickname = webnovel?.user.nickname;
    const author_email = webnovel?.user.email_hash;
    const { email } = useUser();
    const [deletedWebnovelId, setDeletedWebnovelId] = useState<string | undefined>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isMediumScreen = useMediaQuery('(min-width:768px)');
    const [tabValue, setTabValue] = useState('1');
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
            const webnovels_after_deletion = webnovels.filter((w: Webnovel) => w.id.toString() != id)
            setWebnovels(webnovels_after_deletion)
            setDeletedWebnovelId(id);
            setShowDeleteModal(false);
            const ids = webnovels_after_deletion.map((w: Webnovel) => w.id);
            const first = Math.min(...ids);
            if (ids.length > 0) {
                router.push(`/view_webnovels?id=${first.toString()}`)
            } else {
                router.push('/view_webnovels')
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

    const getWebnovel = () => {
        return webnovels.find(w => w.id.toString() == id)
    }
    const theWebnovel = getWebnovel();

    if (id === undefined) {
        return (
            <div className='md:max-w-screen-lg w-full flex flex-row justify-center mx-auto h-screen md:mt-[-96px] mt-[-80px]'>
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
        if (webnovelLoading || userWebnovelsLoading) {
            return (
                <div role="status" className={`w-16 absolute top-1/2 left-1/2 -translate-y-8 -translate-x-8`}>
                    <CircularProgress color='secondary' />
                </div>
            )
        } else if (atLeastOneWebnovel) {
            return (
                <ThemeProvider theme={grayTheme}>
                    <div className='max-w-screen-lg flex md:flex-row md:space-x-4 flex-col justify-center mx-auto'>

                        {/*--  left-hand side:  Author's other works link */}
                        <div className='w-full md:w-1/4 p-4 border-r md:block hidden'>
                            <Suspense>
                                <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
                            </Suspense>
                            <hr className='block md:hidden mt-4 mb-4 bg-[#142448] h-[1px]' />
                        </div>
                        {/*-- left-hand side:  Author's other works link end */}

                        <div className='w-full md:w-3/4 flex flex-col space-y-4 p-4'>
                            <div className="">
                                {
                                    <div className='flex flex-row justify-between'>
                                        <div className='flex flex-row justify-center self-center'>
                                            <ChevronLeft className='self-center' />
                                            <h1>
                                                {/* 목록보기 */}
                                                {phrase(dictionary, "list", language)}
                                            </h1>
                                        </div>

                                        <div>
                                            {isAuthor() &&
                                                <div className='flex flex-row gap-4 w-full justify-start'>
                                                    {/* 
                                        <NoCapsButton color='wb' variant='outlined' onClick={handleAIEditor}>
                                            {phrase(dictionary, "aieditor", language)}
                                        </NoCapsButton> 
                                        */}
                                                    <NoCapsButton
                                                        color='gray'
                                                        variant='outlined'
                                                        onClick={handleNewChapter}
                                                        className='px-4 flex items-center justify-center hover:border-[#DB2777] text-black dark:text-white hover:text-[#DB2777]'
                                                    >
                                                        {isMediumScreen ? <p className='text-black dark:text-white  hover:text-[#DB2777]'>{phrase(dictionary, "uploadNewChapter", language)}</p> : (<> <PenLine className='hover:text-[#DB2777]' size={18} /> </>)}
                                                    </NoCapsButton>
                                                    <NoCapsButton
                                                        color='gray'
                                                        variant='outlined'
                                                        onClick={() => setShowDeleteModal(true)}
                                                        className='px-6 flex items-center justify-center hover:border-[#DB2777] text-black dark:text-white hover:text-[#DB2777]'
                                                    >
                                                        {isMediumScreen ? <p className='text-black dark:text-white  hover:text-[#DB2777]'>{phrase(dictionary, "deleteWebnovel", language)}</p> : (<> <Trash className='hover:text-[#DB2777]' size={18} /> </>)}
                                                    </NoCapsButton>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>

                            <hr className='mt-4 mb-10 bg-[#142448] h-[1px]' />

                            {/* Webnovel info and details */}
                            <WebNovelInfoAndPictureComponent webnovel={theWebnovel} />

                            <TabContext value={tabValue} >
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className='dark:text-gray-700'>
                                    <TabList onChange={handleChange} aria-label="lab API tabs example" textColor="secondary" indicatorColor="secondary" className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]">
                                        {/* Chapters : 연재글 */}
                                        <Tab label={phrase(dictionary, "chapters", language)} value="1" className="dark:text-white dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />
                                        {/* Comments : 댓글 */}
                                        <Tab label={phrase(dictionary, "comments", language)} value="2" className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]" />
                                    </TabList>
                                </Box>
                                <TabPanel value="1">
                                    {/* Chapters list */}
                                    <ListOfChaptersComponent webnovel={theWebnovel} />
                                </TabPanel>
                                <TabPanel value="2">
                                    {/* Comments list */}
                                    {theWebnovel && <ListOfChapterComments content={theWebnovel} chapter={theWebnovel.chapters[0]} webnovelOrWebtoon={true}/>}
                                </TabPanel>
                            </TabContext>

                        </div>
                    </div>
                    <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                        <Box sx={useModalStyle}>
                            <div className='flex flex-col space-y-4 items-center justify-center'>
                                <p className='text-lg font-bold text-black dark:text-black'>{phrase(dictionary, "deleteWebnovelConfirm", language)}</p>
                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={handleDelete}>{phrase(dictionary, "yes", language)}</Button>
                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowDeleteModal(false)}>{phrase(dictionary, "no", language)}</Button>
                            </div>
                        </Box>
                    </Modal>
                </ThemeProvider >
            )
        } else {
            return (
                <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto h-[80vh]'>
                    {phrase(dictionary, "noWebnovelsFound", language)}
                </div>
            )
        }
    }
}

export default ViewWebnovelsComponent;

