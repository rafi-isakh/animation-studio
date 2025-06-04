import { Webnovel } from "@/components/Types"
import InfoAndPictureComponent from '@/components/UI/InfoAndPictureComponent';


const AuthorAndWebnovelsAsideComponent = ({ webnovel, nickname, coverArt, onNewChapter, onDelete, relatedContent }:
    { webnovel: Webnovel, nickname: string | null | undefined, coverArt: string, onNewChapter?: () => void, onDelete?: () => void, relatedContent?: Webnovel[] }) => {

    return (
        <InfoAndPictureComponent content={webnovel} coverArt={coverArt} onNewChapter={onNewChapter} onDelete={onDelete} relatedContent={relatedContent} />
    )
}

export default AuthorAndWebnovelsAsideComponent