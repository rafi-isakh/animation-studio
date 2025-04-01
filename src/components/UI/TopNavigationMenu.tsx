import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/shadcnUI/Textarea";
import Link from "next/link";
import { Copy, Share2, EllipsisVertical, Flag, Trash, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from '@/contexts/UserContext';
import { createEmailHash } from '@/utils/cryptography'
import { User, ToonyzPost } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import ShareDialog from "@/components/UI/ShareDialog";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mui/material";
import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { ScrollArea } from "@/components/shadcnUI/ScrollArea";
import { truncateText } from "@/utils/truncateText";

const TopNavigationMenu = ({ email, isAuthor, user, postId, post }: { email: string, isAuthor?: boolean, user: User, postId: string, post: ToonyzPost }) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { id, email_hash } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [title, setTitle] = useState(post.title || "");
  const [content, setContent] = useState(post.content || "");
  const [tags, setTags] = useState<string[]>(post.tags ? post.tags.split(',') : []);
  const [tagInput, setTagInput] = useState("");

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


  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.includes(',')) {
      const newTag = value.replace(',', '').trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    } else {
      setTagInput(value);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
    else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };


  const handleEditPost = async (postId: string) => {
    try {
      const formData = new FormData();
      formData.append('postId', postId);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('tags', tags.join(',')); // Convert tags array to comma-separated string

      const response = await fetch(`/api/update_toonyz_post`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const data = await response.json();
      console.log(data);

      const sessionKey2 = `toonyz_post.${postId}.${language}.title`;
      console.log(localStorage.getItem(sessionKey2)); 
      localStorage.removeItem(sessionKey2);
      console.log(localStorage.getItem(sessionKey2)); 



      toast({
        title: "Post edited",
        description: "Your post has been edited",
        variant: "success",
      });

      setShowEditModal(false);
      router.push(`/toonyz_posts/${postId}`);
      router.refresh();
      
    } catch (error) {
      console.error("Error editing post", error);
      toast({
        title: "Error editing post",
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
                <AlertDialogTrigger asChild >
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

                {/* delete modal */}
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

                {/* edit modal */}
                {/* <AlertDialog open={showEditModal} onOpenChange={setShowEditModal}>
                  <AlertDialogTrigger asChild>
                    <Link
                      href="#"
                      key="edit"
                      onClick={(e) => {
                        // e.preventDefault
                        // setShowEditModal(true);
                      }}
                      className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                      <Pencil size={10} className="dark:text-white text-gray-500" />
                      {phrase(dictionary, "edit", language)}
                    </Link>
                  </AlertDialogTrigger>
                  <AlertDialogContent
                    className={`select-none no-scrollbar backdrop-blur-md z-[9999]
                                     ${isDesktop ? ' backdrop-blur-md  bg-gradient-to-r dark:from-blue-500/10 dark:to-blue-900/10  from-purple-100/50 to-blue-100/50' : 'bg-white dark:bg-[#211F21]'}`}
                    onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{phrase(dictionary, "editPost", language)}</AlertDialogTitle>
                      {post.image && (<>
                        <Image
                          src={getImageUrl(post.image)}
                          alt={`image ${post.id}`}
                          width={250}
                          height={250}
                          className="self-center object-cover rounded-xl border-none group-hover:opacity-50 transition-opacity duration-300"
                        />
                        <div
                          className="w-full !select-none text-black dark:text-white  bg-gray-100 dark:bg-[#211F21] p-4 rounded-md"
                        >
                          {truncateText(post.quote || "", 150)}
                        </div>
                      </>)
                      }
                      {post.video && (
                        <>
                          <video
                            src={getVideoUrl(post.video)}
                            width={250}
                            height={250}
                            autoPlay={true}
                            muted={true}
                            loop={true}
                            playsInline
                            className='self-center object-cover rounded-xl border-none group-hover:opacity-50 transition-opacity duration-300'
                          />
                        </>
                      )}
                    </AlertDialogHeader>
                    <ScrollArea className="flex flex-col">
                      <div className="items-center">
                        <Label htmlFor="name" className="text-right text-sm">
                          {phrase(dictionary, "title", language)}
                        </Label>
                        <Input
                          placeholder={post.title}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="items-center">
                        <Label htmlFor="tags" className="text-right text-sm">
                          {phrase(dictionary, "tags", language)}
                        </Label>
                        <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 col-span-3">
                          {tags.length > 0 ? (
                            tags.map((tag, i) => (
                              <span
                                key={i}
                                className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center"
                              >
                                {tag}
                                <X
                                  size={14}
                                  className="ml-1 cursor-pointer"
                                  onClick={() => removeTag(tag)}
                                />
                              </span>
                            ))
                          ) : null}
                          <Input
                            placeholder={phrase(dictionary, "tags_placeholder", language)}
                            value={tagInput}
                            onChange={handleTagInput}
                            onKeyDown={handleTagKeyDown}
                            className="flex-grow shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6 min-w-20"
                          />
                        </div>
                      </div>
                      <div className="items-center">
                        <Label htmlFor="content" className="text-right text-sm">
                          {phrase(dictionary, "content", language)}
                        </Label>
                        <Textarea
                          placeholder={post.content}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className=""
                          rows={4}
                        />
                      </div>
                    </ScrollArea>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {phrase(dictionary, "cancel", language)}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleEditPost(postId);
                          setShowEditModal(false);
                        }}>
                        {phrase(dictionary, "edit", language)}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog> */}
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