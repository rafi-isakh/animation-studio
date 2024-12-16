import { ThemeProvider } from "@/contexts/providers";
import { ReaderProvider } from "@/contexts/ReaderContext";
import { ReaderThemeProvider } from "@/contexts/ReaderThemeContext";

export default function ChapterViewLayout({ children }: { children: React.ReactNode }) {
    return <>
        <ReaderThemeProvider>
            <ReaderProvider>
                {children}
            </ReaderProvider>
        </ReaderThemeProvider>
    </>
}