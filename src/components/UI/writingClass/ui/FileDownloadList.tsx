"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcnUI/Table"
import { Input } from "@/components/shadcnUI/Input"
import { Button } from "@/components/shadcnUI/Button"
import { DownloadIcon, EyeIcon, FileIcon, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogFooter } from "@/components/shadcnUI/Dialog"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip"

const PDFviewer = dynamic(() => import("@/components/UI/writingClass/ui/PDFviewer"), { ssr: false });

export function FileDownloadList({ language, downloadFiles, isLoggedIn }: { language: string, downloadFiles: { id: number, name: string, modified: string, size: string, author: string, status: string, file_url_ko: string, file_url_en: string }[], isLoggedIn: boolean }) {
    const [selectedFiles, setSelectedFiles] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [showPreview, setShowPreview] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const { toast } = useToast()

    const availableFiles = downloadFiles.filter((file) => file.status === "available")
    const filteredFiles = availableFiles.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const toggleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(filteredFiles.map(file => file.id));
        }
    };

    const toggleSelectFile = (id: number) => {
        if (selectedFiles.includes(id)) {
            setSelectedFiles(selectedFiles.filter((fileId) => fileId !== id))
        } else {
            setSelectedFiles([...selectedFiles, id])
        }
    }

    const downloadFile = (fileName: string) => {
        if (!fileName || fileName.trim() === '') {
            toast({
                title: "Error downloading file",
                description: "File key is missing",
                variant: "destructive",
            });
            console.error('File key is missing');
            return;
        }

        fetch(`/api/download?file=${encodeURIComponent(fileName)}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        toast({
                            title: "Authentication error",
                            description: "You need to be signed in to download files",
                            variant: "destructive",
                        });
                        return Promise.reject(new Error("Authentication error"));
                    }
                    return response.json().then(data => {
                        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
                    }).catch(() => {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    });
                }

                const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator?.userAgent || '');

                if (isSafariBrowser) {
                    // For Safari, we need to handle downloads differently
                    return response.blob().then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = fileName.split('/').pop() || 'download.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        toast({
                            title: "File download started",
                            description: fileName.split('/').pop() || fileName,
                            variant: "success",
                        });
                    });
                }

                // For non-Safari browsers
                window.open(response.url, '_blank');
                toast({
                    title: "File download started",
                    description: fileName.split('/').pop() || fileName,
                    variant: "success",
                });
            })
            .catch(error => {
                if (!(error instanceof Error && error.message.startsWith('HTTP error'))) {
                    toast({
                        title: "Error preparing download",
                        description: error.message || "Could not get download link.",
                        variant: "destructive",
                    });
                }
                console.error('Error downloading file:', error);
            });
    }

    const viewFile = async (fileKey: string) => {
        if (!fileKey || fileKey.trim() === '') {
            toast({
                title: "Error viewing file",
                description: "File key is missing",
                variant: "destructive",
            });
            console.error('File key is missing for preview');
            return;
        }

        setIsPreviewLoading(true);
        setPreviewUrl(null);
        setPreviewError(null);
        setShowPreview(true);

        try {
            const response = await fetch(`/api/download?file=${encodeURIComponent(fileKey)}`);

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMsg);
            }

            // Check if browser is Safari
            const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator?.userAgent || '');

            if (isSafariBrowser) {
                // For Safari, use native PDF viewing
                const pdfBlob = await response.blob();
                const pdfObjectUrl = URL.createObjectURL(pdfBlob);
                setPreviewUrl(pdfObjectUrl);
            } else {
                // For other browsers, use the response URL
                setPreviewUrl(response.url);
            }

        } catch (error: any) {
            console.error('Error fetching file for preview:', error);
            let message = "Could not load preview.";
            if (error instanceof Error) {
                message = error.message;
            }
            setPreviewError(message);
            toast({
                title: "Error loading preview",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsPreviewLoading(false);
        }
    };

    // Cleanup object URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const downloadSelectedFiles = async (fileKeys: string[]) => {
        if (fileKeys.length === 0) {
            toast({
                title: "No files selected",
                description: "Please select files to download.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch('/api/bulk-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keys: fileKeys }),
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                if (response.status === 401) {
                    toast({
                        title: "Authentication error",
                        description: "You need to be signed in to download files",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error downloading files",
                        description: errorMsg,
                        variant: "destructive",
                    });
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            const disposition = response.headers.get('content-disposition');
            let filename = 'download.zip';
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: "Download started",
                description: `${fileKeys.length} files are being downloaded as ${filename}.`,
                variant: "success",
            });

        } catch (error) {
            console.error('Bulk download error:', error);
            if (!(error instanceof Error && error.message.startsWith('HTTP error'))) {
                toast({
                    title: "Error initiating download",
                    description: "Could not initiate bulk download.",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-64">
                    <Input
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {/* Search Icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* <Button variant="outline" size="icon">
                        <RefreshCwIcon className="h-4 w-4" />
                    </Button> */}
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'en' ? 'Name' : '이름'}</TableHead>
                            <TableHead className="hidden md:table-cell">{language === 'en' ? 'Modified' : '수정일'}</TableHead>
                            <TableHead className="hidden md:table-cell">{language === 'en' ? 'Size' : '크기'}</TableHead>
                            <TableHead className="hidden md:table-cell">{language === 'en' ? 'Author' : '작가'}</TableHead>
                            <TableHead className="w-24">{language === 'en' ? 'Actions' : '작업'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFiles.length > 0 ? (
                            filteredFiles.map((file) =>
                                file.status === "available" ? (
                                    <TableRow key={file.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-5 w-5 text-red-500" />
                                                {file.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{file.modified}</TableCell>
                                        <TableCell className="hidden md:table-cell">{file.size}</TableCell>
                                        <TableCell className="hidden md:table-cell">{file.author}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const fileKey = language === "ko" ? file.file_url_ko : file.file_url_en || file.file_url_ko;
                                                                    console.log(`Download clicked: ${fileKey} (${language})`);
                                                                    downloadFile(fileKey);
                                                                }}
                                                                title="Download"
                                                            >
                                                                <DownloadIcon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {language === 'en' ? 'Download' : '다운로드'}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const fileKey = language === "ko" ? file.file_url_ko : file.file_url_en || file.file_url_ko;
                                                                    viewFile(fileKey);
                                                                }}
                                                                title="View"
                                                                disabled={!file.file_url_ko && !file.file_url_en}
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {language === 'en' ? 'View' : '미리보기'}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow key={file.id}>
                                        <TableCell className="font-medium text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-5 w-5 text-red-500" />
                                                {file.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-gray-300">{file.modified}</TableCell>
                                        <TableCell className="hidden md:table-cell text-gray-300">{file.size}</TableCell>
                                        <TableCell className="hidden md:table-cell text-gray-300">{file.author}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button disabled variant="ghost" size="icon" onClick={() => downloadFile(file.name)} title="Download" className="cursor-not-allowed">
                                                    <DownloadIcon className="h-4 w-4 " />
                                                </Button>
                                                <Button disabled variant="ghost" size="icon" title="View" className="cursor-not-allowed">
                                                    <EyeIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            )
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No PDF files found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="md:max-w-screen-xl w-full md:max-h-[90vh] h-full flex flex-col p-0">
                        <div
                            className="flex-grow overflow-y-auto p-0 m-0"
                            style={{
                                WebkitOverflowScrolling: "touch", // smooth scrolling on iOS
                                overflowY: "auto",
                            }}
                        >
                            {isPreviewLoading ? (
                                <div className="flex items-center justify-center h-screen">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                    <span className="ml-2 text-gray-500">Loading preview...</span>
                                </div>
                            ) : previewError ? (
                                <div className="flex items-center justify-center p-4">
                                    <span className="text-red-500">Error: {previewError}</span>
                                </div>
                            ) : previewUrl ? (
                                <PDFviewer pdfUrl={previewUrl} language={language} isLoggedIn={isLoggedIn} />
                            ) : (
                                <div className="flex items-center justify-center p-4">
                                    <span className="text-gray-500">No preview available.</span>
                                </div>
                            )}
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
            </div>

            {/* {
                selectedFiles.length > 0 && (
                    <div className="p-4 border-t flex justify-between items-center bg-gray-50">
                        <div className="text-sm text-gray-500">
                            {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const selectedFileKeys = downloadFiles
                                        .filter((file) => selectedFiles.includes(file.id))
                                        .map((file) => language === "ko" ? file.file_url_ko : file.file_url_en || file.file_url_ko)
                                        .filter((key): key is string => !!key && key.trim() !== '');

                                    if (selectedFileKeys.length === 0) {
                                        toast({
                                            title: "Error",
                                            description: "No valid files selected or selected files are missing keys.",
                                            variant: "destructive",
                                        });
                                        return;
                                    }

                                    console.log(`Bulk download requested for ${selectedFileKeys.length} files.`);
                                    downloadSelectedFiles(selectedFileKeys);
                                }}
                            >
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Download Selected
                            </Button>
                        </div>
                    </div>
                )
            } */}
        </div >
    )
}
