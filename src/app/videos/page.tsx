export default function Videos() {
    const webtoonVideos = [
        <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/4fnBIsX9_Dw?si=faCKtGDgbjS2jmn7" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/bqU8IUq1gZo?si=HoQ7JxrFKlvZV19N" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/9rakUYd2r7E?si=qwAxjQrW0tI3njL3" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
    ]

    const webnovelVideos = [
        <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/Mzij9X5uDTY?si=lU9Rgl3p1SsSXoLm" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/uzQ7ebnUVns?si=2dosrLLuNjkpQaL5" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/C0IjxeDn01A?si=3magNphFLhyG1QsG" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/yMtN4sNHe9E?si=6T4Sjbuf_wIYjr2Z" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/VO5eKFQ50vs?si=YZ0UTqMNW3uNwVHp" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
        <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/rFygTsA83s0?si=WX0uV6KOeLvwEjRJ" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
    ]

    return (
        <div className="flex flex-col space-y-16 items-center justify-center">
            <div className="flex flex-col space-y-4">
                <h1 className="text-2xl font-bold xl:ml-8">웹툰 커리큘럼</h1>
                <div className="grid grid-cols-1 xl:grid-cols-2 mx-auto gap-4 xl:w-[1280px]">
                    {webtoonVideos.map((video, index) => (
                        <div key={index} className="flex items-center justify-center">
                            {video}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col space-y-4">
                <h1 className="text-2xl font-bold xl:ml-8">웹소설 커리큘럼</h1>
                <div className="grid grid-cols-1 xl:grid-cols-2 mx-auto gap-4 xl:w-[1280px]">
                    {webnovelVideos.map((video, index) => (
                        <div key={index} className="flex items-center justify-center">
                            {video}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}