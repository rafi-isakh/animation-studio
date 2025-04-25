'use client'
import { FileDownloadList } from "@/components/UI/writingClass/ui/FileDownloadList"
import { ArrowLeft, PlusIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUser } from "@/contexts/UserContext"
import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"
import SignInComponent from "@/components/SignInComponent"

const bucketBaseUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`;

const downloadFiles = [
  {
    id: 1,
    name: "Toonyz_Writing_Guide_1.pdf",
    modified: "Apr 15, 2023 10:37 AM",
    size: "2.4 MB",
    author: "Toonyz Content Team",
    status: "unavailable",
    file_url_ko: "writing_guide_1_ko.pdf",
    file_url_en: "writing_guide_1_en.pdf",
  },
  {
    id: 2,
    name: "Toonyz_Writing_Guide_2.pdf",
    modified: "Mar 22, 2023 3:55 PM",
    size: "1.8 MB",
    author: "Toonyz Content Team",
    status: "unavailable",
    file_url_ko: "writing_guide_2_ko.pdf",
    file_url_en: "writing_guide_2_en.pdf",
  },
  {
    id: 3,
    name: "Toonyz_Writing_Guide_3.pdf",
    modified: "Feb 09, 2023 3:37 PM",
    size: "4.2 MB",
    author: "Toonyz Content Team",
    status: "unavailable",
    file_url_ko: "writing_guide_3_ko.pdf",
    file_url_en: "writing_guide_3_en.pdf",
  },
  {
    id: 4,
    name: "Toonyz_Writing_Guide_4.pdf",
    modified: "Jan 18, 2023 1:32 PM",
    size: "0.5 MB",
    author: "Toonyz Content Team",
    status: "unavailable",
    file_url_ko: "writing_guide_4_ko.pdf",
    file_url_en: "writing_guide_4_en.pdf",
  },
  {
    id: 5,
    name: "Toonyz_Writing_Guide_5.pdf",
    modified: "April 23, 2025",
    size: "189.7 KB",
    author: "Toonyz Content Team",
    status: "available",
    file_url_ko: "writing_guide_5_ko.pdf",
    file_url_en: "writing_guide_5_en.pdf",
  },
  {
    id: 6,
    name: "Toonyz_Writing_Guide_6.pdf",
    modified: "Dec 12, 2022 11:45 AM",
    size: "3.1 MB",
    author: "Toonyz Content Team",
    status: "unavailable",
    file_url_ko: "writing_guide_6_ko.pdf",
    file_url_en: "writing_guide_6_en.pdf",
  },
]

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
              : <>{nickname} 안녕하세요! 다운로드 가능한 파일이 {downloadFiles.filter((file) => file.status === "available").length}개 있습니다.</>}
          </p>
        </div>
      </div>
      <FileDownloadList language={language} downloadFiles={downloadFiles} />
    </div>
  )
}
