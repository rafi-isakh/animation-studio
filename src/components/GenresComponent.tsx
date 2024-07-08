
const GenresComponent = () => {

    return (
        <div className="max-w-screen-xl flex flex-row items-center justify-between mx-auto p-4 dark">
            <a href="?genre=All" className="flex-1 m-4 text-center block g p-6 hover:text-pink-600 dark:bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 dark:text-white">전체</h5>
            </a>
            <a href="?genre=Romance Fantasy" className="flex-1 m-4 text-center block g p-6 hover:text-pink-500 dark:bg-black dark:border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 dark:text-white">로판</h5>
            </a>
            <a href="?genre=Romance" className="flex-1 m-4 text-center block g p-6 hover:text-pink-600 dark:bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 dark:text-white">로맨스</h5>
            </a>
            <a href="?genre=BL" className="flex-1 m-4 text-center block g p-6 hover:text-pink-600 dark:bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 dark:text-white">BL</h5>
            </a>
            <a href="?genre=Fantasy" className="flex-1 m-4 text-center block g p-6 hover:text-pink-600 dark:bg-black ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight hover:text-pink-500 dark:text-white">판타지</h5>
            </a>
        </div>
    )
}

export default GenresComponent