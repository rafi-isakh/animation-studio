import { ThemeProvider } from "@/contexts/providers";
import { ReaderProvider } from "@/contexts/ReaderContext";
export default function ChapterViewLayout({ children }: { children: React.ReactNode }) {
    return (
        <ReaderProvider>
            {children}
        </ReaderProvider>
    )
}