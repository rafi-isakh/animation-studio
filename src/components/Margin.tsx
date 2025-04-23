"use client"
import { usePathname } from "next/navigation";

export default function Margin({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const marginClasses = pathname === '/' ? 'mb-4'
                        : pathname === '/writing-class' ? 'pl-0'
                        : ''; // pt-14 md:pt-14 mb-4
        // Top header height is 14rem (removed for now)

    return (
        <div className={`children min-h-screen ${marginClasses} md:pl-[72px]
                         ${pathname === '/writing-class' ? '!pl-0' : ''}
                         ${pathname === '/writing-class/downloads' ? '!pl-0' : ''}
                        `}>
            {children}
        </div>
    );
}