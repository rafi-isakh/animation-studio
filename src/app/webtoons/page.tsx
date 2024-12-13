import WebtoonsCardList from "@/components/WebtoonsCardList";
import { Webtoon } from "@/components/Types";
import WebtoonsCarousel from "@/components/WebtoonsCarousel";
import CircularMenuItemsComponent from "@/components/CircularMenuItemsComponent";
import Footer from "@/components/Footer";
import WebtoonsRecommendationCarousel from "@/components/WebtoonsRecommendationCarousel";
import PromotionBannerComponent from "@/components/PromotionBannerComponent";
import { getSignedUrlForWebtoonImage } from "@/utils/s3";

async function getWebtoonCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_carousel_items`,
        {
            cache: "no-store"
        }
    )
    if (!response.ok) {
        throw new Error('Failed to fetch webtoon carousel items')
    }
    const data = await response.json()
    return data
}
const Webtoons = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoons`,
        {
            cache: "no-store"
        }
    )
    const carouselItems = await getWebtoonCarouselItems()
    const shuffledCarouselItems = carouselItems.sort(() => Math.random() - 0.5)
    const data: Webtoon[] = await response.json()
    const webtoonsSorted = JSON.parse(JSON.stringify(data)).sort((a: Webtoon, b: Webtoon) => b.views - a.views)

    const coverArts = await Promise.all(data.map(async (webtoon) => await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)))

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
                    <CircularMenuItemsComponent />
                    {smallGap()}
                </div>
                <WebtoonsCardList titleVar="newReleasesWebnovels" webtoons={data} coverArts={coverArts} detail={false} ranking={false}/>
                {largeGap()}
                <WebtoonsCardList titleVar="newAndTrends" webtoons={webtoonsSorted} coverArts={coverArts} detail={true} ranking={true}/>
                {largeGap()}
                <WebtoonsRecommendationCarousel carouselItems={shuffledCarouselItems} />
                {largeGap()}
                <PromotionBannerComponent />
            </div>

            <Footer />
        </>
    )
}

export default Webtoons;
