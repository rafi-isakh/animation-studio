import WebtoonsCardList from "@/components/WebtoonsCardList";
import { Webtoon } from "@/components/Types";
import WebtoonsCarousel from "@/components/WebtoonsCarousel";
import GenresComponent from "@/components/GenresComponent";
import Footer from "@/components/Footer";
import WebtoonsRecommendationCarousel from "@/components/WebtoonsRecommendationCarousel";
import PromotionBannerComponent from "@/components/PromotionBannerComponent";

const Webtoons = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoons`,
        {
            cache: "no-store"
        }
    )
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
            <WebtoonsCarousel webtoons={data} />
            <div className="flex flex-col justify-center items-center">
            {smallGap()}
                <GenresComponent />
            {smallGap()}
            </div>
            <WebtoonsCardList title="New Releases" webtoons={data} />
            {largeGap()}
            <WebtoonsCardList title="Popular Webtoons" webtoons={data} />
            {largeGap()}
            <WebtoonsRecommendationCarousel />
            {largeGap()}
            <PromotionBannerComponent />
        </div>

        <Footer />
        </>
    )
}

export default Webtoons;
