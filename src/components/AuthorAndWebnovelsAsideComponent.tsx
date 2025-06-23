import { Webnovel } from "@/components/Types"
import InfoAndPictureComponent from '@/components/UI/InfoAndPictureComponent';


const AuthorAndWebnovelsAsideComponent = ({ 
    webnovel, 
    nickname, 
    coverArt, 
    onNewChapter, 
    onDelete, 
    relatedContent, 
    loadingDelete }:
    { webnovel: Webnovel, 
        nickname: string | null | undefined, 
        coverArt: string, 
        onNewChapter?: () => void, 
        onDelete?: () => void, 
        relatedContent?: Webnovel[], 
        loadingDelete: boolean 
    }) => {

    return (
        <InfoAndPictureComponent 
        content={webnovel} 
        coverArt={coverArt} 
        onNewChapter={onNewChapter} 
        onDelete={onDelete} 
        relatedContent={relatedContent} 
        loadingDelete={loadingDelete}
        />
    )
}

export default AuthorAndWebnovelsAsideComponent