
const PICTURES_S3 = process.env.NEXT_PUBLIC_PICTURES_S3
const VIDEOS_S3 = process.env.NEXT_PUBLIC_VIDEOS_CLOUDFRONT

export const getLocalImageUrl = (fileName: string | undefined) => {
    const image_src = `/${fileName}`;
    return image_src;
}

export const getImageUrl = (fileName: string | undefined) => { 
    const image_src = `https://${PICTURES_S3}/${fileName}`;
    return image_src;
}

export const getVideoUrl = (fileName: string | undefined) => { 
    const video_src = `https://${VIDEOS_S3}/${fileName}`;
    return video_src;
}


