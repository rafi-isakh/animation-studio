'use client'
import { FileDownloadList } from "@/components/UI/writingClass/ui/FileDownloadList"
import { ArrowLeft, PlusIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUser } from "@/contexts/UserContext"
import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"

const downloadFiles = [
  {
    id: 1,
    name: "Writing_Guide_1.pdf",
    modified: "Apr 15, 2023 10:37 AM",
    size: "2.4 MB",
    author: "Toonyz Content Team",
    status: "unavailable"
  },
  {
    id: 2,
    name: "Writing_Guide_2.pdf",
    modified: "Mar 22, 2023 3:55 PM",
    size: "1.8 MB",
    author: "Toonyz Content Team",
    status: "unavailable"
  },
  {
    id: 3,
    name: "Writing_Guide_3.pdf",
    modified: "Feb 09, 2023 3:37 PM",
    size: "4.2 MB",
    author: "Toonyz Content Team",
    status: "unavailable"
  },
  {
    id: 4,
    name: "Writing_Guide_4.pdf",
    modified: "Jan 18, 2023 1:32 PM",
    size: "0.5 MB",
    author: "Toonyz Content Team",
    status: "unavailable"
  },
  {
    id: 5,
    name: "Writing_Guide_5.pdf",
    modified: "Jan 05, 2023 1:31 PM",
    size: "8.7 MB",
    author: "Toonyz Content Team",
    status: "available"
  },
  {
    id: 6,
    name: "Writing_Guide_6.pdf",
    modified: "Dec 12, 2022 11:45 AM",
    size: "3.1 MB",
    author: "Toonyz Content Team",
    status: "unavailable"
  },
]


export default function DownloadsPage() {
  const { nickname } = useUser();
  const { isLoggedIn } = useAuth();
  const { language } = useLanguage();
  if (!isLoggedIn) {
    return <div>Please login to view your downloads.</div>
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
            {language === "en" ? <>Hi {nickname} There are 0 files available for download.</>
                                : <>{nickname} 안녕하세요! 다운로드 가능한 파일이 {downloadFiles.filter((file) => file.status === "available").length}개 있습니다.</>}
          </p>
        </div>
        {/* <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Download PDF Files
        </button> */}
      </div>
      <FileDownloadList downloadFiles={downloadFiles} />
    </div>
  )
}
