import { Webnovel } from "@/components/Types"
import InfoAndPictureComponent from '@/components/UI/InfoAndPictureComponent';


const AuthorAndWebnovelsAsideComponent = ({ webnovel, nickname, coverArt, onNewChapter, onDelete }:
    { webnovel: Webnovel, nickname: string | null | undefined, coverArt: string, onNewChapter?: () => void, onDelete?: () => void }) => {

    return (
        <InfoAndPictureComponent content={webnovel} coverArt={coverArt} onNewChapter={onNewChapter} onDelete={onDelete} />
    )
}

export default AuthorAndWebnovelsAsideComponent