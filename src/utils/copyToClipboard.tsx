import { useToast } from "@/hooks/use-toast";

export const useCopyToClipboard = () => {
  const { toast } = useToast();
  
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

  return copyToClipboard;
};
