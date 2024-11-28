import WebtoonsCardList from "@/components/WebtoonsCardList";
import { Webtoon } from "@/components/Types";
import WebtoonsCarousel from "@/components/WebtoonsCarousel";
import GenresComponent from "@/components/GenresComponent";

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
            <div className="flex flex-col gap-10 justify-center items-center">
                {/* Link part */}
                <GenresComponent />
            </div>
            <WebtoonsCardList title="Trending" webtoons={data} />
        </div>
    )
}

export default Webtoons;
