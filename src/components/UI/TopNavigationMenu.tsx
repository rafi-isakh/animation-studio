import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/shadcnUI/Popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcnUI/AlertDialog"
import { Button } from "@/components/shadcnUI/Button";
import { Label } from "@/components/shadcnUI/Label";
import { Input } from "@/components/shadcnUI/Input";
import Link from "next/link";
import { Copy, Share2, EllipsisVertical, Flag, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from '@/contexts/UserContext';
import { createEmailHash } from '@/utils/cryptography'
import { User } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

const TopNavigationMenu = ({ email, user, postId }: { email: string, user: User, postId: string }) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { id, email_hash } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({
          variant: "success",
          title: "Link copied to clipboard!",
          description: "You can now paste it anywhere you want.",
        });
      } else {
        // Fallback for browsers (like Safari) that may not support Clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", ""); // Prevent iOS keyboard from appearing
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px"; // Move element off-screen
        document.body.appendChild(textArea);
        textArea.select();

        // Execute the copy command
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          toast({
            variant: "success",
            title: "Link copied to clipboard!",
            description: "You can now paste it anywhere you want.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Failed to copy",
            description: "Please try selecting and copying the text manually.",
          });
        }
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try selecting and copying the text manually.",
      });
    }
  };

  return (
    <>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <Popover>
          <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
            <Button variant="ghost" size="icon" className='!no-underline !bg-transparent'>
              <EllipsisVertical size={20} className="dark:text-white text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-24 flex flex-col gap-2">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowShareDialog(true);
              }}
              className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
              <Share2 size={10} className="dark:text-white text-gray-500" />
              Share
            </Link>
            <Link
              href="#"
              //   onClick={(e) => {
              //     e.preventDefault();
              //     e.stopPropagation();
              //   }}
              className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
              <Flag size={10} className="dark:text-white text-gray-500" />
              Report
            </Link>
          </PopoverContent>
          {user.email_hash === createEmailHash(email) &&
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Link
                  href="#"
                  key="delete"
                  onClick={() => {
                    setShowDeleteModal(true);
                  }}
                  className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                  <Trash size={20} className="dark:text-white text-black" />
                  {phrase(dictionary, "delete", language)}
                </Link>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      // handleDeleteComment(comment.id.toString());
                      setShowDeleteModal(false);
                    }}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        </Popover>

        {/* share dialog */}
        <DialogContent
          className="sm:max-w-md bg-white dark:bg-[#211F21] select-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>
              Share the link with your friends and family.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={`${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${postId}`}
                readOnly
                className='select-none bg-transparent'
                disabled
              />
            </div>
            <Button
              onClick={() => {
                const linkText = `${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${postId}`;
                copyToClipboard(linkText);
              }}
              type="button"
              size="sm"
              className="px-3"
            >
              <span className="sr-only">Copy</span>
              <Copy />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopNavigationMenu;