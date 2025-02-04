import { ThemeProvider } from "@/contexts/providers";
import { ReaderProvider } from "@/contexts/ReaderContext";
import { ReaderThemeProvider } from "@/contexts/ReaderThemeContext";
import { ChapterProvider } from "@/contexts/ChapterContext";
export default function ChapterViewLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ReaderThemeProvider>
                <ReaderProvider>
                    <ChapterProvider>
                        {children}
                    </ChapterProvider>
                </ReaderProvider>
            </ReaderThemeProvider>
        </ThemeProvider>
    )
}