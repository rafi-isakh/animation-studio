import { Chapter, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { phrase } from '@/utils/phrases';
import OtherTranslateComponent from "./OtherTranslateComponent";
import { useEffect, useState } from "react";
import moment from 'moment';

const ListOfChaptersComponent = ({ webnovel }: { webnovel: Webnovel | undefined }) => {
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);
    const date = new Date();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
        console.log(webnovel?.chapters)
    }, [language])

    const sortFn = (a: Chapter, b: Chapter) => {
        const aDate = new Date(a.created_at).getTime()
        const bDate = new Date(b.created_at).getTime()
        return aDate - bDate
    }

    return (
        <div className="relative overflow-x-auto mt-4 mb-4">
            <table className="w-full text-sm text-center text-black border border-black">
                <thead className="text-xs text-black uppercase bg-white">
                    <tr>
                        <th scope="col" className="px-1 md:px-3 py-3">
                            {phrase(dictionary, "number", language)}
                        </th>
                        <th scope="col" className="px-1 md:px-3 py-3">
                            {phrase(dictionary, "chapterTitle", language)}
                        </th>
                        <th scope="col" className="px-1 md:px-3 py-3">
                            {phrase(dictionary, "uploadDate", language)}
                        </th>
                        <th scope="col" className="px-1 md:px-3 py-3">
                            {phrase(dictionary, "views", language)}
                        </th>
                        <th scope="col" className="px-1 md:px-3 py-3">
                            {phrase(dictionary, "likes", language)}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const chapters = webnovel?.chapters;
                        return (
                            chapters?.sort(sortFn)
                                .map((chapter, index) => (
                                    <tr key={index} className="bg-white">
                                        <th scope="row" className="px-1 md:px-3 py-1 font-medium text-black whitespace-nowrap">
                                            <p>{index + 1}</p>
                                        </th>
                                        <th scope="row" className="px-1 md:px-3 py-1 font-medium text-black whitespace-nowrap hover:text-pink-600">
                                            <Link href={`/chapter_view/${chapter.id}`} className="text-md font-bold">
                                                <OtherTranslateComponent key={key} content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" classParams="max-w-32 md:max-w-64 truncate whitespace-nowrap" />
                                            </Link>
                                        </th>
                                        <th scope="row" className="px-1 md:px-3 py-1 font-medium text-black whitespace-nowrap">
                                            <p>{moment(new Date(chapter.created_at)).format('YYYY/MM/DD')}</p>
                                        </th>
                                        <th scope="row" className="px-1 md:px-3 py-1 font-medium text-black whitespace-nowrap">
                                            <p>{chapter.views}</p>
                                        </th>
                                        <th scope="row" className="px-1 md:px-3 py-1 font-medium text-black whitespace-nowrap">
                                            <p>{chapter.upvotes}</p>
                                        </th>
                                    </tr>
                                ))
                        )
                    })()}
                </tbody>
            </table>
        </div>
    )
}
export default ListOfChaptersComponent;