import { Webnovel } from "@/components/Types"
import Link from "next/link"
import styles from "@/styles/KoreanText.module.css"
import { phrase } from '@/utils/phrases'
import { useLanguage } from "@/contexts/LanguageContext"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronRight,  Heart, Share, Copy  } from 'lucide-react';
import { Button } from "@mui/material";
import Image from "next/image";
import InfoAndPictureComponent from '@/components/UI/InfoAndPictureComponent';


const AuthorAndWebnovelsAsideComponent = ({ webnovel, nickname, coverArt, onNewChapter, onDelete }:
    { webnovel: Webnovel, nickname: string | null | undefined, coverArt: string, onNewChapter?: () => void, onDelete?: () => void }) => {

    return (
        <InfoAndPictureComponent content={webnovel} coverArt={coverArt} onNewChapter={onNewChapter} onDelete={onDelete} />
    )
}

export default AuthorAndWebnovelsAsideComponent