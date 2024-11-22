import WebtoonsCardList from "@/components/WebtoonsCardList";
import { Webtoon } from "@/components/Types";

const Webtoons = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoons`,
        {
            cache: "no-store"
        }
    )
    const data: Webtoon[] = await response.json()
    return (
        <WebtoonsCardList title="Trending" webtoons={data} />
    )
}

export default Webtoons;
