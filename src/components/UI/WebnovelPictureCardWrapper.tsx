import React from "react"
import { Webnovel } from "@/components/Types"
import Link from "next/link"
import MainPagePictureOrVideoComponent from "@/components/MainPagePictureOrVideoComponent"
const WebnovelPictureCardWrapper = ({ webnovel }: { webnovel: Webnovel }) => {

    return (
        <Link href={`/view_webnovels/${webnovel.id}`} className="relative w-full">
            <MainPagePictureOrVideoComponent webnovel={webnovel} />
        </Link>
    )
}

export default WebnovelPictureCardWrapper