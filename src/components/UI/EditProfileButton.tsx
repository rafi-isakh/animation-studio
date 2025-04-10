'use client'
import {
  Dialog,
  DialogClose,
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

export function EditProfileButton({ nickname, setDisplayNickname }: { nickname: string, setDisplayNickname: (nickname: string) => void }) {
  const [value, setValue] = useState(nickname);
  const [changedNickname, setChangedNickname] = useState(nickname);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const { provider, bio, email, picture, id } = useUser();
  const { language, dictionary } = useLanguage();
  const router = useRouter();
  const validateInput = () => {
    if (!value.trim()) {
      setError('Nickname cannot be empty');
      return false;
    }
    if (value.length < 2) {
      setError('Nickname must be at least 2 characters');
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
      formData.append('bio', bio);
      formData.append('nickname', value.trim());
      formData.append('picture', picture);

      const response = await fetch('/api/update_user', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to update nickname", response.status);
        throw new Error("Failed to update nickname");
      }
      const data = await response.json();
      console.log(data);

      setChangedNickname(data.nickname);
      setDisplayNickname(data.nickname);
      setError('');
      setIsLoading(false);
      setOpen(false);
      
    } catch (error) {
      console.error("Error updating nickname:", error);
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
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-black" showCloseButton>
        <DialogHeader>
          <DialogTitle>{phrase(dictionary, "editProfile", language)}</DialogTitle>
          <DialogDescription>
            {phrase(dictionary, "editProfileDescription", language)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>{isLoading ? phrase(dictionary, "saving", language) : phrase(dictionary, "saveChanges", language)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default EditProfileButton;