import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { Label } from "@/components/shadcnUI/Label";
import { Input } from "@/components/shadcnUI/Input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCopyToClipboard } from "@/utils/copyToClipboard";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
export default function ShareDialog({
    url,
    title = "Share link",
    description = "Share the link with your friends and family.",
    mode = "share",
    shareImage
}: {
    url?: string;
    title?: string;
    description?: string;
    mode?: "share" | "toonyzPostShare";
    shareImage?: string;
}) {
    const { toast } = useToast();
    const copyToClipboard = useCopyToClipboard();

    return (
        <DialogContent
            showCloseButton={true}
            className="sm:max-w-md bg-white dark:bg-[#211F21] select-none"
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {description}
                </DialogDescription>
            </DialogHeader>
            {mode === "share" && url ? (
                <div className="flex flex-col items-center gap-2">
                    {shareImage && (
                        <div className="">
                            <Image src={getImageUrl(shareImage)} alt="Share image" width={130} height={190} className="object-contain rounded-lg" />
                        </div>
                    )}
                    <div className="w-full flex flex-row gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={url}
                            readOnly
                            className='select-none bg-transparent'
                            disabled
                        />
                        <Button
                            onClick={() => { copyToClipboard(url) }}
                            type="button"
                            size="sm"
                            className="px-3"
                        >
                            <span className="sr-only">Copy</span>
                            <Copy />
                        </Button>
                    </div>
                </div>) : mode === "toonyzPostShare" ? (
                    <div className="flex items-center space-x-2">
                        {shareImage && (
                            <Image src={getImageUrl(shareImage)} alt="Share image" width={130} height={190} />
                        )}
                    </div>
                ) : <></>
            }
            <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}