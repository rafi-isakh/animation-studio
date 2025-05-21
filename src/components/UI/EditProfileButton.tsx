'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcnUI/Dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Input } from "@/components/shadcnUI/Input"
import { Label } from "@/components/shadcnUI/Label"
import { Button } from "@/components/shadcnUI/Button"
import { PencilLine } from "lucide-react"
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/shadcnUI/Textarea";
import { useToast } from "@/hooks/use-toast";

export function EditProfileButton({ nickname, setDisplayNickname, setDisplayBio }: { nickname: string, setDisplayNickname: (nickname: string) => void, setDisplayBio: (bio: string) => void }) {
  const { provider, bio, email, picture, id } = useUser();
  const [value, setValue] = useState(nickname);
  const [userBio, setUserBio] = useState(bio);
  const [changedNickname, setChangedNickname] = useState(nickname);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const { language, dictionary } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const validateInput = () => {
    if (!value.trim()) {
      setError('Nickname cannot be empty');
      toast({
        title: 'Error',
        description: 'Nickname cannot be empty',
      });
      return false;
    }
    if (value.length < 2) {
      setError('Nickname must be at least 2 characters');
      toast({
        title: 'Error',
        description: 'Nickname must be at least 2 characters',
      });
      return false;
    }
    if (value.length > 15) {
      setError('Nickname must be less than 15 characters');
      toast({
        title: 'Error',
        description: 'Nickname must be less than 15 characters',
      });
      return false;
    }
    if (userBio.length > 100) {
      setError('Bio must be less than 100 characters');
      toast({
        title: 'Error',
        description: 'Bio must be less than 100 characters',
      });
      return false;
    }
    if (userBio.includes('http')) {
      setError('Bio cannot contain links');
      toast({
        title: 'Error',
        description: 'Bio cannot contain links',
      });
      return false;
    }
    if (userBio.includes('www.')) {
      setError('Bio cannot contain www.');
      toast({
        title: 'Error',
        description: 'Bio cannot contain www.',
      });
      return false;
    }
    // Check for HTML tags in nickname
    const htmlTagRegex = /<[^>]*>/g;
    if (htmlTagRegex.test(value)) {
      setError('Nickname cannot contain HTML tags');
      toast({
        title: 'Error',
        description: 'Nickname cannot contain HTML tags',
      });
      return false;
    }
    // Check for HTML tags in bio
    if (htmlTagRegex.test(userBio)) {
      setError('Bio cannot contain HTML tags');
      toast({
        title: 'Error',
        description: 'Bio cannot contain HTML tags',
      });
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('bio', userBio.trim());
      formData.append('nickname', value.trim());
      formData.append('picture', picture);

      const response = await fetch('/api/update_user', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to update nickname", response.status);
        toast({
          title: 'Error',
          description: 'Failed to update nickname',
        });
        throw new Error("Failed to update nickname");
      }
      const data = await response.json();
      console.log(data);

      setChangedNickname(data.nickname);
      setDisplayNickname(data.nickname);
      setUserBio(data.bio);
      setDisplayBio(data.bio);
      setError('');
      setIsLoading(false);
      setOpen(false);
      router.push('/my_profile');

    } catch (error) {
      console.error("Error updating nickname:", error);
      toast({
        title: 'Error',
        description: 'Failed to update nickname',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setOpen(true)} size="icon" variant="ghost" className="!no-underline rounded-full">
                <PencilLine />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {phrase(dictionary, "editProfile", language)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto' showCloseButton={true}>
        <DialogHeader className='p-4'>
          <DialogTitle>{phrase(dictionary, "editProfile", language)}</DialogTitle>
          <DialogDescription>
            {phrase(dictionary, "editProfileDescription", language)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-4 mb-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-left">
              {phrase(dictionary, "nickname", language)}
            </Label>
            <Input id="name" value={changedNickname} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-left">
              {phrase(dictionary, "newNickname", language)}
            </Label>
            <Input id="username" value={value} className="col-span-3" onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-left">
              {phrase(dictionary, "edit_bio", language)}
            </Label>
            <Textarea id="bio" value={userBio} className="col-span-3" placeholder={bio} onChange={(e) => setUserBio(e.target.value)} />
          </div>
        </div>
        <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : phrase(dictionary, "saveChanges", language)}
          </Button>
          <Button
            onClick={() => setOpen(false)}
            className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
          >
            {phrase(dictionary, "cancel", language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default EditProfileButton;