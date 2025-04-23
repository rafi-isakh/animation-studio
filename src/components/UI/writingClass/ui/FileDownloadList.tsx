"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcnUI/Table"
import { Checkbox } from "@/components/shadcnUI/Checkbox"
import { Input } from "@/components/shadcnUI/Input"
import { Button } from "@/components/shadcnUI/Button"
import { DownloadIcon, EyeIcon, FilterIcon, MoreHorizontalIcon, RefreshCwIcon, FileIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcnUI/DropdownMenu"

export function FileDownloadList({ downloadFiles }: { downloadFiles: { id: number, name: string, modified: string, size: string, author: string, status: string }[] }) {
    const [selectedFiles, setSelectedFiles] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState("")

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
        // In a real application, this would trigger the actual file download
        alert(`Downloading ${fileName}`)
    }

    const viewFile = (fileName: string) => {
        // In a real application, this would open the PDF for viewing
        alert(`Viewing ${fileName}`)
    }

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
                    <Button variant="outline" size="icon">
                        <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Modified</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead className="hidden md:table-cell">Author</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFiles.length > 0 ? (
                            filteredFiles.map((file) =>
                                file.status === "available" ? (
                                    <TableRow key={file.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedFiles.includes(file.id)}
                                                onCheckedChange={() => toggleSelectFile(file.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-5 w-5 text-red-500" />
                                                {file.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{file.modified}</TableCell>
                                        <TableCell>{file.size}</TableCell>
                                        <TableCell className="hidden md:table-cell">{file.author}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => downloadFile(file.name)} title="Download">
                                                    <DownloadIcon className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => viewFile(file.name)} title="View">
                                                    <EyeIcon className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontalIcon className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => downloadFile(file.name)}>Download</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => viewFile(file.name)}>View</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow key={file.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedFiles.includes(file.id)}
                                                onCheckedChange={() => toggleSelectFile(file.id)}
                                                disabled
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-5 w-5 text-red-500" />
                                                {file.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">{file.modified}</TableCell>
                                        <TableCell className="text-gray-300">{file.size}</TableCell>
                                        <TableCell className="hidden md:table-cell text-gray-300">{file.author}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button disabled variant="ghost" size="icon" onClick={() => downloadFile(file.name)} title="Download" className="cursor-not-allowed">
                                                    <DownloadIcon className="h-4 w-4 " />
                                                </Button>
                                                <Button disabled variant="ghost" size="icon" onClick={() => viewFile(file.name)} title="View" className="cursor-not-allowed">
                                                    <EyeIcon className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button disabled variant="ghost" size="icon" className="cursor-not-allowed">
                                                            <MoreHorizontalIcon className="h-4 w-4 " />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => downloadFile(file.name)}>Download</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => viewFile(file.name)}>View</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
            </div>

            {
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
                                    const selectedFileNames = downloadFiles
                                        .filter((file) => selectedFiles.includes(file.id))
                                        .map((file) => file.name)
                                    alert(`Downloading: ${selectedFileNames.join(", ")}`)
                                }}
                            >
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Download Selected
                            </Button>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
