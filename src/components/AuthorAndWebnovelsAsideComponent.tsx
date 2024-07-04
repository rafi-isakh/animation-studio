import { Webnovel } from "@/components/Types"
import Link from "next/link"

const AuthorAndWebnovelsAsideComponent = ({webnovels, username}: 
    {webnovels: Webnovel[], username: string}) => {

    return (
        <div className="flex flex-col space-y-4 w-1/4">
            <p className="text-2xl">{username}님의 작품</p>
            <div className="flex flex-col space-y-4">
                {webnovels.map(webnovel => (
                    <Link href={`/view_webnovels?id=${webnovel.id}`} className="text-md hover:text-pink-600">{webnovel.title}</Link>
                ))}
            </div>
        </div>
    )
}

export default AuthorAndWebnovelsAsideComponent