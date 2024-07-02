
const GenresComponent = () => {

    return (
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-pink-200 rounded-lg shadow hover:bg-pink-100 dark:bg-pink-800 dark:border-pink-700 dark:hover:bg-pink-700">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">로판</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-pink-200 rounded-lg shadow hover:bg-pink-100 dark:bg-pink-800 dark:border-pink-700 dark:hover:bg-pink-700">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">로맨스</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-pink-200 rounded-lg shadow hover:bg-pink-100 dark:bg-pink-800 dark:border-pink-700 dark:hover:bg-pink-700">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">BL</h5>
            </a>
            <a href="#" className="flex-1 m-4 text-center block max-w-full p-6 bg-white border border-pink-200 rounded-lg shadow hover:bg-pink-100 dark:bg-pink-800 dark:border-pink-700 dark:hover:bg-pink-700">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">판타지</h5>
            </a>
        </div>
    )
}

export default GenresComponent