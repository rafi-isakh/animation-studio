import WebtoonsCardList from "@/components/WebtoonsCardList";
import { Webtoon } from "@/components/Types";
import WebtoonsCarousel from "@/components/WebtoonsCarousel";
import GenresComponent from "@/components/GenresComponent";
import Footer from "@/components/Footer";
import WebtoonsRecommendationCarousel from "@/components/WebtoonsRecommendationCarousel";
import PromotionBannerComponent from "@/components/PromotionBannerComponent";

async function getWebtoonCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_carousel_items`)
    if (!response.ok) {
        throw new Error('Failed to fetch webtoon carousel items')
    }
    const data = await response.json()
    console.log(data)
    return data
}
const Webtoons = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoons`,
        {
            cache: "no-store"
        }
    )
    const carouselItems = await getWebtoonCarouselItems()
    const data: Webtoon[] = await response.json()


    const largeGap = () => {
        return (
            <div className='md:h-[5rem] h-[3rem]' />
        )
    }

    const smallGap = () => {
        return (
            <div className='md:h-[2rem] h-[1rem]' />
        )
    }

    return (
        <>
            <div className="max-w-screen-lg mx-auto md:px-0 px-4">
                <WebtoonsCarousel webtoons={data} carouselItems={carouselItems} />
                <div className="flex flex-col justify-center items-center">
                    {smallGap()}
                    <GenresComponent />
                    {smallGap()}
                </div>
                <WebtoonsCardList titleVar="newReleasesWebnovels" webtoons={data} />
                {largeGap()}
                <WebtoonsCardList titleVar="newAndTrends" webtoons={data} />
                {largeGap()}
                <WebtoonsRecommendationCarousel carouselItems={carouselItems} />
                {largeGap()}
                <PromotionBannerComponent />
            </div>

            <Footer />
        </>
    )
}

export default Webtoons;
