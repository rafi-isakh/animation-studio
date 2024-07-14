import { Webnovel } from "@/components/Types"
import Link from "next/link"

const AuthorAndWebnovelsAsideComponent = ({webnovels, nickname}: 
    {webnovels: Webnovel[], nickname: string | null}) => {

    return (
        <div className="hidden md:block flex flex-col space-y-4 w-1/4 mr-10">
            <p className="text-2xl">{nickname}님의 작품</p>
            <div className="flex flex-col space-y-4">
                {webnovels.map((webnovel, index) => (
                    <Link key={index} href={`/view_webnovels?id=${webnovel.id}`} className="text-md hover:text-pink-600">{webnovel.title}</Link>
                ))}
            </div>
        </div>
    )
}

export default AuthorAndWebnovelsAsideComponent