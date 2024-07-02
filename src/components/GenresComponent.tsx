
const GenresComponent = () => {

    return (
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 dark">
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:text-pink-600 dark:bg-black dark:border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 hover:text-pink-500 dark:text-white">전체</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:text-pink-500 dark:bg-black dark:border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 hover:text-pink-500 dark:text-white">로판</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:text-pink-600 dark:bg-black dark:border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 hover:text-pink-500 dark:text-white">로맨스</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:text-pink-600 dark:bg-black dark:border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 hover:text-pink-500 dark:text-white">BL</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:text-pink-600 dark:bg-black dark:border-gray-700 ">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 hover:text-pink-500 dark:text-white">판타지</h5>
            </a>
        </div>
    )
}

export default GenresComponent