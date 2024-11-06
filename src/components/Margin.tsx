"use client"
import { usePathname } from "next/navigation";

export default function Margin({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const marginClasses = pathname === '/' ? 'mb-4' : 'pt-28 md:pt-24 mb-4';

    return (
        <div className={`children min-h-screen ${marginClasses}`}>
            {children}
        </div>
    );
}