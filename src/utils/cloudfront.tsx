const CLOUDFRONT = process.env.NEXT_PUBLIC_CLOUDFRONT

export const getImageURL = (fileName: string | undefined) => {
    const image_src = `https://${CLOUDFRONT}/${fileName}`;
    return image_src;
}