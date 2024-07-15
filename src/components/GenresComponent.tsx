import Link from "next/link"

const GenresComponent = () => {

    return (
        //<div className="max-w-screen-xl flex flex-row items-center justify-between mx-auto p-4 dark">
        <div className="scrollbar-hide max-w-screen-xl mx-auto snap-x justify-between overflow-x-scroll flex px-4 py-4">
            <Link href="?genre=All" className="flex-grow min-w-[120px] mr-4 text-center block g p-6 hover:text-pink-600 bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 text-white">전체</h5>
            </Link>
            <Link href="?genre=Romance Fantasy" className="flex-grow min-w-[120px] mr-4 text-center block g p-6 hover:text-pink-500 bg-black border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 text-white">로판</h5>
            </Link>
            <Link href="?genre=Romance" className="flex-grow min-w-[120px] mr-4 text-center block g p-6 hover:text-pink-600 bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 text-white">로맨스</h5>
            </Link>
            <Link href="?genre=BL" className="flex-grow min-w-[120px] mr-4 text-center block g p-6 hover:text-pink-600 bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 text-white">BL</h5>
            </Link>
            <Link href="?genre=Fantasy" className="flex-grow min-w-[120px] mr-4 text-center block g p-6 hover:text-pink-600 bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 text-white">판타지</h5>
            </Link>
        </div>
    )
}

export default GenresComponent