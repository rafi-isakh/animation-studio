"use client"
import { usePathname } from "next/navigation";

export default function Margin() {
    const pathname = usePathname();
    return (
        pathname == '/' && (
            <div className="h-6"></div>
        )
    )
}