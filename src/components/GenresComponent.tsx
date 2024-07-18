import Link from "next/link";

const GenresComponent = () => {
    return (
        <div className="scrollbar-hide max-w-screen-xl mx-auto snap-x justify-between overflow-x-scroll flex px-4 py-4">
            <Link href="?genre=All" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-black rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">전체</h6>
            </Link>
            <Link href="?genre=Romance Fantasy" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-black rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">로판</h6>
            </Link>
            <Link href="?genre=Romance" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-black rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">로맨스</h6>
            </Link>
            <Link href="?genre=BL" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-black rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">BL</h6>
            </Link>
            <Link href="?genre=Fantasy" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-black rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">판타지</h6>
            </Link>
        </div>
    );
};

export default GenresComponent;
