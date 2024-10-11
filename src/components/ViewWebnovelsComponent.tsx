"use client"
import { Webnovel } from '@/components/Types'
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from '@/components/WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from '@/components/ListOfChaptersComponent';
import { useUser } from '@/contexts/UserContext';
import '@/styles/globals.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Box, Button, CircularProgress, Modal, ThemeProvider } from '@mui/material';
import { grayTheme, NoCapsButton } from '@/styles/BlackWhiteButtonStyle';
import { style } from '@/styles/ModalStyles';



const ViewWebnovelsComponent = ({ searchParams, webnovel, userWebnovels }: {
    searchParams: { [key: string]: string | string[] | undefined },
    webnovel: Webnovel | null, userWebnovels: Webnovel[] | null
}) => {
    const [loading, setLoading] = useState(true);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [atLeastOneWebnovel, setAtLeastOneWebnovel] = useState(false);
    const id = searchParams.id;
    const [refreshKey, setRefreshKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const nickname = webnovel?.user.nickname;
    const author_email = webnovel?.user.email;
    const { email } = useUser();
    const [deletedWebnovelId, setDeletedWebnovelId] = useState<string | undefined>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    if (typeof id === 'string') {
    } else if (Array.isArray(id)) {
        throw new Error("there should be only one id param")
    } else {
    }
    const router = useRouter();

    useEffect(() => {
        if (webnovel) {
            setAtLeastOneWebnovel(true);
        } else {
            setAtLeastOneWebnovel(false);
        }
        if (userWebnovels) {
            setAtLeastOneWebnovel(true);
            setWebnovels(userWebnovels);
        }
        setLoading(false);
    }, [webnovel, userWebnovels, deletedWebnovelId]);

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

    const getWebnovel = () => {
        return webnovels.find(w => w.id.toString() == id)
    }
    if (!loading) {
        if (atLeastOneWebnovel) {
            return (
                <ThemeProvider theme={grayTheme}>
                    <div className='max-w-screen-xl flex md:flex-row md:space-x-4 flex-col justify-center mx-auto'>
                        <div className='w-full md:w-1/4 p-4'>
                            <Suspense>
                                <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
                            </Suspense>
                            <hr className='block md:hidden mt-4 mb-4 bg-[#142448] h-1' />
                        </div>
                        <div className='w-full md:w-3/4 flex flex-col space-y-4 p-4'>
                            <Suspense>
                                <WebNovelInfoAndPictureComponent webnovel={getWebnovel()} />
                            </Suspense>
                            <div className="mt-4">
                                {
                                    <div className='flex flex-row'>
                                        {(author_email == email) &&
                                            <div className='flex flex-col space-y-4 w-32'>
                                                {/* <NoCapsButton color='wb' variant='outlined' onClick={handleAIEditor}>
                                                    {phrase(dictionary, "aieditor", language)}
                                                </NoCapsButton> */}
                                                <NoCapsButton color='gray' variant='outlined' onClick={handleNewChapter}>
                                                    {phrase(dictionary, "uploadNewChapter", language)}
                                                </NoCapsButton>
                                                <NoCapsButton color='gray' variant='outlined' onClick={() => setShowDeleteModal(true)}>
                                                    {phrase(dictionary, "deleteWebnovel", language)}
                                                </NoCapsButton>
                                            </div>
                                        }
                                        <div className='w-32 h-32'>

                                        </div>
                                    </div>
                                }
                            </div>
                            <ListOfChaptersComponent webnovel={getWebnovel()} />
                        </div>
                    </div >
                    <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                        <Box sx={style}>
                            <div className='flex flex-col space-y-4 items-center justify-center'>
                                <p className='text-lg font-bold'>{phrase(dictionary, "deleteWebnovelConfirm", language)}</p>
                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={handleDelete}>{phrase(dictionary, "yes", language)}</Button>
                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowDeleteModal(false)}>{phrase(dictionary, "no", language)}</Button>
                            </div>
                        </Box>
                    </Modal>
                </ThemeProvider>
            )
        }
        else {
            return (
                <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
                    {phrase(dictionary, "noWebnovelsFound", language)}
                </div>
            )
        }
    }
    else {
        return (
            <div role="status" className={`w-16 absolute top-1/2 left-1/2 -translate-y-8 -translate-x-8`}>
                <CircularProgress color='secondary' />
            </div>
        )
    }
};

export default ViewWebnovelsComponent;

