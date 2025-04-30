import { ChevronLeft, ChevronRight } from "lucide-react";
import { scroll } from '@/utils/scroll'

export default function CardsScroll({ scrollRef, shift = false, className = '' }: { scrollRef: React.RefObject<HTMLDivElement>, shift?: boolean, className?: string }) {
    const top = shift ? 'top-[55%]' : 'top-[40%]';
    return (
        <div className='z-[100]'>
            <button
                onClick={() => scroll('left', scrollRef)}
                className={`bg-white/80 dark:bg-black/80 group-hover:opacity-80 transition-opacity 
            duration-300 absolute h-20
            left-0 ${top} -translate-y-1/2 z-50 p-1 opacity-0 rounded-sm`}
            >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
                onClick={() => scroll('right', scrollRef)}
                className={`bg-white/80 dark:bg-black/80 group-hover:opacity-80 transition-opacity 
            duration-300 absolute h-20
            right-0 ${top} -translate-y-1/2 z-50 p-1 opacity-0 rounded-sm`}
            >
                <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
        </div>
    )
}