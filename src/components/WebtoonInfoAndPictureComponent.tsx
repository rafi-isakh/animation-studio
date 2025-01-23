import InfoAndPictureComponent from '@/components/UI/InfoAndPictureComponent';
import { Webtoon } from "@/components/Types";

export default function WebtoonInfoAndPictureComponent({ webtoon, coverArt }: { webtoon: Webtoon, coverArt: string }) {
    return <InfoAndPictureComponent content={webtoon} coverArt={coverArt} isWebtoon={true} />;
}