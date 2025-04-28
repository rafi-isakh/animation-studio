'use client'
import { FileDownloadList } from "@/components/UI/writingClass/ui/FileDownloadList"
import { ArrowLeft, PlusIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUser } from "@/contexts/UserContext"
import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"
import SignInComponent from "@/components/SignInComponent"
import { downloadFiles } from "../data/downloadFiles";

// const bucketBaseUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`;

export default function DownloadsPage() {
  const { nickname } = useUser();
  const { isLoggedIn } = useAuth();
  const { language } = useLanguage();
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <p className="text-lg font-bold text-gray-800 text-center">{language === "en" ? "Please login to view downloads" : "로그인 후 다운로드 가능합니다."}</p>
        <div className='flex flex-col items-center justify-center h-[70vh] !p-10'>
          <SignInComponent redirectTo="/writing-class/downloads" />
        </div>
      </div>)
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <Link href="/writing-class" className="inline-flex gap-1 mb-6 font-bold text-gray-500 hover:text-gray-700">
        <ArrowLeft /> {language === "en" ? "Back to page" : "뒤로 가기"}
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Download Files</h1>
          <p className="text-gray-500 mt-1">
            {language === "en" ? <>Hi {nickname}</>
              : <>{nickname}님 안녕하세요! 다운로드 가능한 파일이 {downloadFiles.filter((file) => file.status === "available").length}개 있습니다.</>}
          </p>
        </div>
      </div>
      <FileDownloadList language={language} downloadFiles={downloadFiles} />
    </div>
  )
}
