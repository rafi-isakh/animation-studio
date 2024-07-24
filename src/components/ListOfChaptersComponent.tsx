import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

const ListOfChaptersComponent = ({ webnovel }: { webnovel: Webnovel | undefined }) => {
    const {dictionary, language} = useLanguage();
    return (
        <div className="relative overflow-x-auto mt-4 rounded">
            <table className="w-full text-sm text-center text-white border border-2 border-black">
                <thead className="text-xs text-white uppercase bg-black">
                    <tr>
                        <th scope="col" className="px-2 md:px-6 py-3">
                        {Object.keys(dictionary).length != 0 && dictionary["number"][language]}
                        </th>
                        <th scope="col" className="px-2 md:px-6 py-3">
                        {Object.keys(dictionary).length != 0 && dictionary["webnovelTitle"][language]}
                        </th>
                        <th scope="col" className="px-2 md:px-6 py-3">
                        {Object.keys(dictionary).length != 0 && dictionary["uploadDate"][language]}
                        </th>
                        <th scope="col" className="px-2 md:px-6 py-3">
                        {Object.keys(dictionary).length != 0 && dictionary["views"][language]}
                        </th>
                        <th scope="col" className="px-2 md:px-6 py-3">
                        {Object.keys(dictionary).length != 0 && dictionary["likes"][language]}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const chapters = webnovel?.chapters;
                        return (
                            chapters?.map((chapter, index) => (
                                <tr key={index} className="bg-white">
                                    <th scope="row" className="px-2 md:px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <p>{index + 1}</p>
                                    </th>
                                    <th scope="row" className="px-2 md:px-6 py-4 font-medium text-black whitespace-nowrap hover:text-pink-600">
                                        <Link href={`/chapter_view/${chapter.id}`} className="text-md font-bold">{chapter.title}</Link>
                                    </th>
                                    <th scope="row" className="px-2 md:px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <p>{chapter.created_at}</p>
                                    </th>
                                    <th scope="row" className="px-2 md:px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <p>{chapter.views}</p>
                                    </th>
                                    <th scope="row" className="px-2 md:px-6 py-4 font-medium text-black whitespace-nowrap">
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