import { Webnovel } from "@/components/Types";
import Link from "next/link";

const ListOfChaptersComponent = ({ webnovel }: { webnovel: Webnovel }) => {
    return (
        <div className="relative overflow-x-auto mt-4">
            <table className="w-full text-sm text-left rtl:text-right text-white">
                <thead className="text-xs text-white uppercase bg-black">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            회차
                        </th>
                        <th scope="col" className="px-6 py-3">
                            작품명
                        </th>
                        <th scope="col" className="px-6 py-3">
                            작품등록일
                        </th>
                        <th scope="col" className="px-6 py-3">
                            조회
                        </th>
                        <th scope="col" className="px-6 py-3">
                            좋아요
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const chapters = webnovel?.chapters;
                        return (
                            chapters?.map((chapter) => (
                                <tr className="bg-white">
                                    <th scope="row" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <p>{chapter.id}</p>
                                    </th>
                                    <th scope="row" className="px-6 py-4 font-medium text-black whitespace-nowrap hover:text-pink-600">
                                        <Link href={`/chapter_view/${chapter.id}`} className="text-md">{chapter.title}</Link>
                                    </th>
                                    <th scope="row" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <p>{chapter.created_at}</p>
                                    </th>
                                    <th scope="row" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <p>{chapter.views}</p>
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