import WebtoonsCardList from "@/components/WebtoonsCardList";
import { Webtoon } from "@/components/Types";
import WebtoonsCarousel from "@/components/WebtoonsCarousel";

const Webtoons = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoons`,
        {
            cache: "no-store"
        }
    )
    const data: Webtoon[] = await response.json()
    return (
        <div className="space-y-20">
            <WebtoonsCarousel webtoons={data} />
            <WebtoonsCardList title="Trending" webtoons={data} />
        </div>
    )
}

export default Webtoons;
