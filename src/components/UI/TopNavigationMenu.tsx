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
import ShareDialog from "@/components/UI/ShareDialog";
import { useRouter } from "next/navigation";


const TopNavigationMenu = ({ email, isAuthor, user, postId }: { email: string, isAuthor?: boolean, user: User, postId: string }) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { id, email_hash } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();


  const handleDeletePost = async (postId: string) => {
   try {
    const response = await fetch(`/api/delete_toonyz_post?id=${postId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      toast({
        title: "Error deleting post",
        description: "Please try again",
        variant: "destructive",
      });
      console.error("Error deleting comment");
    }
    toast({
      title: "Post deleted",
      description: "Your post has been deleted",
        variant: "success",
      });
      router.push("/feeds");
    } catch (error) {
      console.error("Error deleting post", error);
      toast({
        title: "Error deleting post",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }


  return (
    <>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <Popover>
          <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
            <Button variant="ghost" size="icon" className='!no-underline !bg-transparent'>
              <EllipsisVertical size={20} className="dark:text-white text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-28 flex flex-col gap-2 break-keep">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowShareDialog(true);
              }}
              className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
              <Share2 size={10} className="dark:text-white text-gray-500" />
              {phrase(dictionary, "share", language)}
            </Link>
            <Link
              href="#"
              //   onClick={(e) => {
              //     e.preventDefault();
              //     e.stopPropagation();
              //   }}
              className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
              <Flag size={10} className="dark:text-white text-gray-500" />
              {phrase(dictionary, "report", language)}
            </Link>
            {createEmailHash(email) === user.email_hash &&
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Link
                    href="#"
                    key="delete"
                    onClick={(e) => {
                      e.preventDefault
                      setShowDeleteModal(true);
                    }}
                    className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                    <Trash size={10} className="dark:text-white text-gray-500" />
                    {phrase(dictionary, "delete", language)}
                  </Link>
                </AlertDialogTrigger>
                <AlertDialogContent className="dark:bg-[#211F21] bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{phrase(dictionary, "deletePost", language)}</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {phrase(dictionary, "cancel", language)}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleDeletePost(postId);
                        setShowDeleteModal(false);
                      }}>
                      {phrase(dictionary, "delete", language)}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            }
          </PopoverContent>
        </Popover>
        {/* share dialog */}
        <ShareDialog url={`${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${postId}`} description={`Share this post with your friends and family.`} />
      </Dialog>
    </>
  );
};

export default TopNavigationMenu;