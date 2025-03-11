// NOT BEING USED 
'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/shadcnUI/Button';
import GeneratedPicture from '@/components/GeneratedPicture';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToastAction } from "@/components/shadcnUI/Toast";
import { CircleHelp, Loader2, Share, ArrowRight } from 'lucide-react';
import { ffmpegCombineToSlideshow } from '@/utils/ffmpeg';
import ShareAsToonyzPostModal from './ShareAsToonyzPostModal';
import { ImageOrVideo } from './Types';
import { v4 as uuidv4 } from 'uuid';
import { getImageUrl } from '@/utils/urls';
import { RadioGroup, RadioGroupItem } from "@/components/shadcnUI/RadioGroup";
import { useToast } from "@/hooks/use-toast";
import { CircularProgress } from '@/components/shadcnUI/CircularProgress';
import { CardStack } from '@/components/UI/CardStack';
import CardStyleButton from './UI/CardStyleButton';
import Link from 'next/link';
import { downloadVideo, uploadVideo } from '@/utils/s3';
interface PictureGeneratorProps {
    prompt: string;
    onComplete: (pictures: string[]) => void;
    webnovel_id: string;
    chapter_id: string;
    context: string;
}

const PictureGenerator: React.FC<PictureGeneratorProps> = ({ prompt: initialPrompt, onComplete, webnovel_id, chapter_id, context }) => {
    const [pictures, setPictures] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedPrompt, setSavedPrompt] = useState<string>(initialPrompt);
    const { dictionary, language } = useLanguage();
    const [showAlert, setShowAlert] = useState(false);
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    const [videoFileName, setVideoFileName] = useState<string | null>(null);
    const { toast } = useToast()
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (initialPrompt) {
            setSavedPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    const generatePictures = async () => {
        if (!savedPrompt) {
            toast({
                title: "Error",
                description: "Please provide a prompt",
                variant: "destructive"
            })
            setError('Please provide a prompt');
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (5 * Math.random());
                return newProgress > 95 ? 95 : newProgress;
            });
        }, 300);

        try {
            const response = await fetch(`/api/generate_pictures`, {
                method: 'POST',
                body: JSON.stringify({ text: savedPrompt, n: 4, context: context })
            })

            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        toast({
                            title: "Error",
                            description: "Please login to generate pictures",
                            variant: "destructive",
                            action: <ToastAction altText="Try again">Try again</ToastAction>,
                            altText: "Try again"
                        })
                        throw new Error('Please login to generate pictures');
                    case 429:
                        toast({
                            title: "Error",
                            description: "Too many requests. Please try again later.",
                            variant: "destructive"
                        })
                        throw new Error('Too many requests. Please try again later.');
                    default:
                        toast({
                            title: "Error",
                            description: "Error: Failed to generate pictures",
                            variant: "destructive"
                        })
                        throw new Error('Failed to generate pictures');
                }
            }

            const data = await response.json();

            if (!data.images || !Array.isArray(data.images)) {
                toast({
                    title: "Error",
                    description: "Invalid response format from server",
                    variant: "destructive"
                })
                throw new Error('Invalid response format from server');
            }
            setPictures(data.images);
            onComplete(data.images);
            setProgress(100);
            clearInterval(progressInterval);
        } catch (err) {
            clearInterval(progressInterval);
            setProgress(0);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (error) {
            setShowAlert(true);
            // Set timer to hide alert
            const timer = setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            // Cleanup timer
            return () => clearTimeout(timer);
        }
    }, [error]);

    const makeVideo = async () => {
        console.log("making video");
        const videoUrls: string[] = [];
        for (const picture of pictures) {
            const pictureFilename = uuidv4();
            const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
                method: 'POST',
                // make just one picture to a video as test.
                body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}.png`, fileType: "image/png" }),
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
                body: JSON.stringify({ video_prompt: "", image_url: image_url }),
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to generate video, please try again later",
                    variant: "destructive"
                })
                throw new Error('Failed to generate video');
            }
            const data = await response.json();
            const url = data.video;
            videoUrls.push(url);
        }
        const videoBase64Strings = await Promise.all(videoUrls.map(downloadVideo));
        const stitchedResponse = await fetch('/api/ffmpeg_combine_videos_to_slideshow', {
            method: 'POST',
            body: JSON.stringify({ videos: videoBase64Strings }),
        });
        if (!stitchedResponse.ok) {
            toast({
                title: "Error",
                description: "Failed to stitch videos",
                variant: "destructive"
            })
        }
        const stitchedData = await stitchedResponse.json();
        const videoData = stitchedData.video;
        const uploadedVideoFilename = await uploadVideo(videoData);
        if (!uploadedVideoFilename) {
            toast({
                title: "Error",
                description: "Failed to upload video",
                variant: "destructive"
            })
            throw new Error('Failed to upload video');
        }
        setVideoFileName(uploadedVideoFilename);
        toast({
            title: "Success",
            variant: "success",
            description: "Video created successfully",
        })
        setShowShareAsPostModal(true);
    }

    const makeSlideshow = async () => {
        try {
            const response = await fetch('/api/ffmpeg_combine_to_slideshow', {
                method: 'POST',
                body: JSON.stringify({ pictures }),
            });
            setIsLoading(true);
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
            setVideoFileName(data.fileName);
            toast({
                title: "Success",
                variant: "success",
                description: "Slideshow created successfully",
            })
            setShowShareAsPostModal(true);
            setIsLoading(false);
        } catch (error) {
            console.error('Slideshow creation error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An unexpected error occurred creating slideshow",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative w-full select-none">
            {/* picture generator */}
            <div className="flex md:flex-row flex-col items-center gap-4 space-y-4 flex-grow-0">
                <div className="flex-1 bg-gray-100 dark:bg-[#373737] p-3 rounded-lg flex flex-col min-h-[100px]">
                    {/* Text content with scrolling if needed */}
                    <div className="flex-1 overflow-y-auto flex-grow-0">
                        <p className="text-sm text-gray-600 dark:text-gray-300  p-4">
                            {savedPrompt}
                        </p>
                    </div>

                    <div className='flex-grow-0 flex flex-row justify-between text-gray-500'>
                        <div className='flex flex-row gap-4 p-4 items-center '>
                            {/* {savedPrompt.length}/200 */}
                            <span className='text-[0.875rem]'>Free trial 100</span>
                        </div>
                        <Button
                            variant="outline"
                            onClick={generatePictures}
                            disabled={isLoading}
                            className='px-4 py-2 font-bold ml-4 bg-white dark:text-pink-600 dark:bg-white 
                        inline-flex items-center justify-center gap-2 min-w-[100px] self-end'
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-pink-600" />
                                    <span className="text-[16px]">
                                        {phrase(dictionary, "generatingPrompt", language)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[16px]">
                                        {phrase(dictionary, "generatePrompt", language)}
                                    </span>
                                    {/* Palette icon */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-palette text-pink-600"
                                    >
                                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                                    </svg>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </div>

            {isLoading && (
                <div className="flex flex-col items-center mt-4">
                    <CircularProgress value={progress} color="stroke-[#DE2B74]" trackColor="stroke-pink-200" />
                    <p className="text-sm text-muted-foreground mt-2">
                        Generating images... {Math.round(progress)}%
                    </p>
                </div>
            )}

            {pictures.length > 0 && (
                <div className="flex flex-col gap-4 mt-6 select-none">
                    <div className="grid grid-cols-2 gap-1 ">
                        {pictures.map((picture, index) => {
                            return (
                                <GeneratedPicture
                                    key={index}
                                    index={index}
                                    image={picture}
                                    webnovel_id={webnovel_id}
                                    chapter_id={chapter_id}
                                    quote={savedPrompt}
                                    makeSlideshow={makeSlideshow}
                                    makeVideo={makeVideo}
                                />
                            )
                        }
                        )}
                    </div>

                    {pictures.length > 0 && (
                        <div className='flex md:flex-row flex-col gap-4 justify-center mt-1'>
                            <Button
                                variant="outline"
                                onClick={makeVideo}
                                className='inline-flex h-52 w-full bg-pink-600 text-white text-lg font-medium tracking-wide p-2 rounded-3xl border-0'>
                                Make Video
                                <ArrowRight className='w-4 h-4' />
                            </Button>
                            <Link
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    makeSlideshow();
                                }}
                                className='relative'>
                                <CardStyleButton
                                    title="Slideshow"
                                    subtitle="Watch Ads to make a slideshow"
                                    ideaCount={pictures.length}
                                    images={pictures}
                                    gradientFrom="#DE2B74"
                                    gradientTo="#FF6F91"
                                    className='w-full'
                                />
                            </Link>
                        </div>
                    )}
                </div>
            )}
            <ShareAsToonyzPostModal
                imageOrVideo={'video' as ImageOrVideo}
                showShareAsPostModal={showShareAsPostModal}
                setShowShareAsPostModal={setShowShareAsPostModal}
                index={0}
                videoFileName={videoFileName!}
                webnovel_id={webnovel_id}
                chapter_id={chapter_id}
                quote={savedPrompt}
            />
        </div>
    );
};

export default PictureGenerator;