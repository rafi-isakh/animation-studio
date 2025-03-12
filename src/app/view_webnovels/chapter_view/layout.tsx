import { ReaderProvider } from "@/contexts/ReaderContext";
export default function ViewWebnovelsLayout({ children }: { children: React.ReactNode }) {
    return (
        <ReaderProvider>
            {children}
        </ReaderProvider>
    )
}