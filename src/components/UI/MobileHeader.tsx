import Image from "next/image"
import Link from "next/link"
import { useTheme } from "@/contexts/providers"

export default function MobileHeader() {
    const { theme } = useTheme();
    const logoWidth = 100;
    const logoHeight = 100;

    return (
        <div className="absolute top-0 left-0 right-0 w-full z-[999] flex flex-row justify-between items-center p-4">
            <Link href="/?version=premium" className="flex items-center gap-3 rtl:space-x-reverse md:p-0 pl-1">
                {/* logo padding on mobile screen */}
                <Image
                    src={theme === 'dark' ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
                    alt="Toonyz Logo"
                    width={logoWidth}
                    height={logoHeight} />
            </Link>
        </div>
    )
}