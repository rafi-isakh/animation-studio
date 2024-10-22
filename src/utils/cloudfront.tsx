const CLOUDFRONT = process.env.NEXT_PUBLIC_CLOUDFRONT

export const getImageURL = (fileName: string | undefined) => {
    const image_src = `/${fileName}`;
    return image_src;
}

export const getCloudfrontImageURL = (fileName: string | undefined) => { 
    const image_src = `https://${CLOUDFRONT}/${fileName}`;
    return image_src;
}

export const getCloudfrontURL = (fileName: string | undefined) => { // getCloudfrontURL 
    const file_src = `https://${CLOUDFRONT}/${fileName}`;
    return file_src;
}


