"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogFooter } from "@/components/shadcnUI/Dialog"
import { useToast } from "@/hooks/use-toast"
import RoundedButton from "@/components/UI/writingClass/RoundedButton/RoundedButton"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import dynamic from "next/dynamic"

const PDFviewer = dynamic(() => import("@/components/UI/writingClass/ui/PDFviewer"), { ssr: false });

export default function PDFPreviewButton({ language, file_url_en, file_url_ko, isLoggedIn }: any) {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const { toast } = useToast()

  const viewFile = async (fileKey: string) => {
    if (!fileKey || fileKey.trim() === "") {
      toast({
        title: "Error viewing file",
        description: "File key is missing",
        variant: "destructive",
      })
      return
    }

    setIsPreviewLoading(true)
    setPreviewUrl(null)
    setPreviewError(null)
    setShowPreview(true)
    setPageNumber(1)

    try {
      const response = await fetch(`/api/download?file=${encodeURIComponent(fileKey)}`)

      if (!response.ok) {
        let errorMsg = `HTTP error! Status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch (e) { }
        throw new Error(errorMsg)
      }

      const pdfBlob = await response.blob()
      const pdfObjectUrl = URL.createObjectURL(pdfBlob)
      setPreviewUrl(pdfObjectUrl)
    } catch (error: any) {
      console.error("Error fetching file for preview:", error)
      let message = "Could not load preview."
      if (error instanceof Error) message = error.message
      setPreviewError(message)
      toast({
        title: "Error loading preview",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // New function to trigger native download
  const downloadFile = async (fileKey: string) => {
    if (!fileKey || fileKey.trim() === "") {
      toast({
        title: "Error downloading file",
        description: "File key is missing",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a temporary anchor element
      const link = document.createElement("a")

      // Set the href to the download API endpoint
      link.href = `/api/download?file=${encodeURIComponent(fileKey)}&download=true`

      // Set download attribute to force download
      link.setAttribute("download", "book.pdf")

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: "Your file download has started",
      })
    } catch (error) {
      console.error("Error triggering download:", error)
      toast({
        title: "Error downloading file",
        description: "Could not download the file",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <>
      {isLoggedIn ? (
        <RoundedButton className="w-[330px] md:mx-0 mx-auto dark:text-black">
          <Link href="/writing-class/downloads" className="flex items-center gap-2">
            <Download size={16} />
            {language === "en" ? "Download Free Books" : "무료로 작법서 다운 받기"}
          </Link>
        </RoundedButton>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <RoundedButton
            className="w-[330px] md:mx-0 mx-auto dark:text-black flex items-center justify-center gap-2"
            onClick={() => {
              const fileKey = language === "ko" ? file_url_ko : file_url_en || file_url_ko
              viewFile(fileKey)
            }}
          >
            <Download size={16} />
            {language === "en" ? "Download Free Book" : "무료로 작법서 다운받기"}
          </RoundedButton>
        </div>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-screen-lg w-full md:max-h-[90vh] h-full flex flex-col p-0" showCloseButton>
          <div className="flex-1 overflow-auto p-4">
            {isPreviewLoading ? (
              <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading preview...</span>
              </div>
            ) : previewError ? (
              <div className="text-red-500 text-center">{previewError}</div>
            ) : previewUrl ? (
              <PDFviewer pdfUrl={previewUrl} />
            ) : null}
          </div>
          <DialogFooter className="flex flex-col gap-2 justify-center items-center">
            <p className="text-sm text-gray-500">
              {language === 'en' ? 'Chrome and Safari browser is recommended for preview.'
                : 'PC에서 미리보기 하는 것을 권장합니다.'}
            </p>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              {language === 'en' ? 'Close' : '닫기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
