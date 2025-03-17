"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import { ImageOrVideo } from '@/components/Types';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/utils/urls';
import { v4 as uuidv4 } from 'uuid';
import { truncateText } from '@/utils/truncateText';
import { phrase } from '@/utils/phrases';
import { useUser } from './UserContext';
import { useLanguage } from './LanguageContext';
// Define the type for the context data
interface CreateMediaContextType {
    isLoading: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    progress: number;
    setProgress: Dispatch<SetStateAction<number>>;
    savedPrompt: string;
    setSavedPrompt: Dispatch<SetStateAction<string>>;
    prompts: string[];
    setPrompts: Dispatch<SetStateAction<string[]>>;
    pictures: string[];
    setPictures: Dispatch<SetStateAction<string[]>>;
    webnovel_id: string;
    setWebnovelId: Dispatch<SetStateAction<string>>;
    chapter_id: string;
    setChapterId: Dispatch<SetStateAction<string>>;
    draggableNodeRef: React.RefObject<HTMLDivElement>;
    openDialog: boolean;
    setOpenDialog: Dispatch<SetStateAction<boolean>>;
    selection: string;
    setSelection: Dispatch<SetStateAction<string>>;
    position: { x: number; y: number; width?: number; height?: number };
    setPosition: Dispatch<SetStateAction<{ x: number; y: number; width?: number; height?: number }>>;
    promotionBannerRef: React.MutableRefObject<React.JSX.Element>;
    source: 'webnovel' | 'chapter';
    narrations: string[];
    setNarrations: Dispatch<SetStateAction<string[]>>;
    videoFileName: string | null;
    setVideoFileName: Dispatch<SetStateAction<string | null>>;
    showShareAsPostModal: boolean;
    setShowShareAsPostModal: Dispatch<SetStateAction<boolean>>;
    loadingVideoGeneration: boolean;
    setLoadingVideoGeneration: Dispatch<SetStateAction<boolean>>;
    makeSlideshow: () => Promise<void>;
    makeVideo: () => Promise<void>;
    generateTrailer: (chapter_ids: number[]) => Promise<void>;
    shareType: ImageOrVideo;
    setShareType: Dispatch<SetStateAction<ImageOrVideo>>;
}

// Create context with default values
const CreateMediaContext = createContext<CreateMediaContextType | undefined>(undefined);

// Provider props
interface CreateMediaProviderProps {
    children: ReactNode;
    initialValues?: Partial<CreateMediaContextType>;
}

// Create the provider component
export function CreateMediaProvider({ children }: CreateMediaProviderProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [savedPrompt, setSavedPrompt] = useState('');
    const [prompts, setPrompts] = useState<string[]>([]);
    const [pictures, setPictures] = useState<string[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [narrations, setNarrations] = useState<string[]>([]);
    const [videoFileName, setVideoFileName] = useState<string | null>(null);
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    const [loadingVideoGeneration, setLoadingVideoGeneration] = useState(false);
    const [webnovel_id, setWebnovelId] = useState<string>("");
    const [chapter_id, setChapterId] = useState<string>("");
    const [shareType, setShareType] = useState<ImageOrVideo>("video");
    // Default refs - these would typically be initialized properly in the component using the context
    const defaultDraggableNodeRef = React.useRef<HTMLDivElement>(null);
    const defaultPromotionBannerRef = React.useRef<React.JSX.Element>(<></>);
    const [selection, setSelection] = useState<string>("");
    const [position, setPosition] = useState<{ x: number; y: number; width?: number; height?: number }>({ x: 0, y: 0 });
    const { toast } = useToast();
    const { stars, setInvokeCheckUser } = useUser();
    const { dictionary, language } = useLanguage();

    useEffect(() => {
        if (pictures.length > 0) {
            let i = 0;
            for (const picture of pictures) {
                console.log(`picture from [] ${i}`, truncateText(picture, 150));
                i++;
            }
        }
    }, []);

    useEffect(() => {
        if (pictures.length > 0) {
            let i = 0;
            for (const picture of pictures) {
                console.log(`picture ${i}`, truncateText(picture, 150));
                i++;
            }
        }
    }, [pictures]);


    const generateTrailer = async (chapter_ids: number[]) => {
        if (stars < 20) {
            toast({
                title: "Error",
                description: phrase(dictionary, "notEnoughStars", language),
                variant: "destructive"
            })
            return;
        }
        setIsLoading(true);
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (5 * Math.random());
                return newProgress > 95 ? 95 : newProgress;
            });
        }, 300);
        const response = await fetch(`/api/generate_trailer_prompts_and_pictures`, {
            method: 'POST',
            body: JSON.stringify({ chapter_ids: chapter_ids, trailer_style: "default", trailer_type: "B" })
        })
        if (!response.ok) {
            toast({
                title: "Error",
                description: "Failed to generate trailer, please try again later",
                variant: "destructive"
            })
            throw new Error('Failed to generate trailer: generate_trailer_prompts_and_pictures');
        }
        setInvokeCheckUser(prev => !prev); // invoke to update stars after generating pictures
        const data = await response.json();
        setPictures(data.images);
        setPrompts(data.prompts);
        setNarrations(data.narrations);
        clearInterval(progressInterval);
        setIsLoading(false);
        // Hands off to CreateMediaArea for rest of logic
    }

    // there's makeSlideshow and makeVideo.
    // the logic is largely the same, except in makeSlideshow, we upload the pictures to s3, make a slideshow, then upload.
    // in makeVideo, we don't need to upload to s3 because we get a url back from vidu. so we generate videos, combine, then upload.
    // combining and uploading are done in the backend.
    const makeSlideshow = async () => {
        try {
            setLoadingVideoGeneration(true);
            const pictureFilenames = [];
            const uploadPromises = pictures.map(async (picture) => {
                const pictureFilename = uuidv4() + ".png";
                const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
                    method: 'POST',
                    body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}`, fileType: "image/png", bucketName: "toonyzbucket" }),
                });
                if (!uploadResponse.ok) {
                    toast({
                        title: "Error", 
                        description: "Failed to upload picture to s3, please try again later",
                        variant: "destructive"
                    })
                    throw new Error('Failed to upload picture to s3');
                }
                return pictureFilename;
            });

            const filenames = await Promise.all(uploadPromises);
            pictureFilenames.push(...filenames);
            const response = await fetch('/api/ffmpeg_combine_pictures_to_slideshow', {
                method: 'POST',
                body: JSON.stringify({ picture_urls: pictureFilenames.map(getImageUrl), narrations: narrations }),
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to make slideshow",
                    variant: "destructive"
                })
                throw new Error('Failed to make slideshow, please try again later');
            }
            const data = await response.json();
            console.log(data);
            setVideoFileName(data.video_filename);
            toast({
                title: "Success",
                variant: "success",
                description: "Slideshow created successfully",
            })
        } catch (error) {
            console.error('Slideshow creation error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An unexpected error occurred creating slideshow",
                variant: "destructive"
            });
        } finally {
            setShowShareAsPostModal(true);
            setLoadingVideoGeneration(false);
        }
    }

    const makeVideo = async () => {
        if (stars < 35 * pictures.length) {
            toast({
                title: "Error",
                description: phrase(dictionary, "notEnoughStars", language),
                variant: "destructive"
            })
            return;
        }
        setLoadingVideoGeneration(true);
        const videoUrls: string[] = [];
        const processPromises = pictures.map(async (picture, i) => {
            const pictureFilename = uuidv4();
            const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
                method: 'POST',
                body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}.png`, fileType: "image/png", bucketName: "toonyzbucket" }),
            });
            if (!uploadResponse.ok) {
                toast({
                    title: "Error",
                    description: "Failed to upload picture to s3, please try again later",
                    variant: "destructive"
                })
                throw new Error('Failed to upload picture to s3');
            }
            const image_url = getImageUrl(`${pictureFilename}.png`);
            const response = await fetch('/api/generate_video', {
                method: 'POST',
                body: JSON.stringify({ video_prompt: prompts[i], image_url: image_url }),
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to generate video, please try again later",
                    variant: "destructive"
                })
                throw new Error('Failed to generate video');
            }
            setInvokeCheckUser(prev => !prev); // invoke to update stars after generating pictures
            const data = await response.json();
            const url = data.video_url;
            console.log(`video ${i} url: `, url);
            return url;
        });

        const urls = await Promise.all(processPromises);
        videoUrls.push(...urls);

        const stitchedResponse = await fetch('/api/ffmpeg_combine_videos', {
            method: 'POST',
            body: JSON.stringify({ video_urls: videoUrls, narrations: narrations }),
        });
        if (!stitchedResponse.ok) {
            toast({
                title: "Error",
                description: "Failed to stitch videos",
                variant: "destructive"
            })
        }
        const stitchedData = await stitchedResponse.json();
        const videoFilename = stitchedData.video_filename;
        setVideoFileName(videoFilename);
        toast({
            title: "Success",
            variant: "success",
            description: "Video created successfully",
        })
        setShowShareAsPostModal(true);
        setLoadingVideoGeneration(false);
    }

    const value: CreateMediaContextType = {
        isLoading,
        setIsLoading,
        progress,
        setProgress,
        savedPrompt,
        setSavedPrompt,
        prompts,
        setPrompts,
        pictures,
        setPictures,
        webnovel_id,
        setWebnovelId,
        chapter_id,
        setChapterId,
        draggableNodeRef: defaultDraggableNodeRef,
        openDialog,
        setOpenDialog,
        selection,
        setSelection,
        position,
        setPosition,
        promotionBannerRef: defaultPromotionBannerRef,
        source: 'chapter',
        narrations,
        setNarrations,
        videoFileName,
        setVideoFileName,
        showShareAsPostModal,
        setShowShareAsPostModal,
        loadingVideoGeneration,
        setLoadingVideoGeneration,
        makeSlideshow,
        makeVideo,
        generateTrailer,
        shareType,
        setShareType,
    };

    return <CreateMediaContext.Provider value={value}>{children}</CreateMediaContext.Provider>;
}

// Custom hook for using the context
export function useCreateMedia() {
    const context = useContext(CreateMediaContext);
    if (context === undefined) {
        throw new Error('useCreateMedia must be used within a CreateMediaProvider');
    }
    return context;
}

// Export the context and provider
export default CreateMediaContext;