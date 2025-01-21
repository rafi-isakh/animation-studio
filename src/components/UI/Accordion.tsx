import React, { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionData {
    title: string;
    subtitle: string;
    title_ko?: string;
    subtitle_ko?: string;
}

interface AccordionProps {
    data: AccordionData[];
    className?: string;
    titleClassName?: string;
    subtitleClassName?: string;
}

const AccordionItem = ({
    title,
    subtitle,
    isOpen,
    onClick,
    titleClassName,
    subtitleClassName
}: {
    title: string;
    subtitle: string;
    isOpen: boolean;
    onClick: () => void;
    titleClassName?: string;
    subtitleClassName?: string;
}) => {
    const contentHeight = useRef<HTMLDivElement>(null);
    return (
        <div className="overflow-hidden border-b border-gray-200">
            <button
                className={`flex flex-row justify-between items-center w-full px-4 py-2 ${isOpen ? "active" : ""} ${titleClassName}`}
                onClick={onClick}
            >
                <div className="flex-1 text-left py-2">
                    <p className="question-content">
                        {title}
                    </p>
                </div>
                <ChevronDown 
                    className={`arrow ml-4 flex-shrink-0 ${isOpen ? "rotate-180" : ""} transition-all duration-300 ease-in`} 
                />
            </button>

            <div
                ref={contentHeight}
                className={`answer-container ${subtitleClassName}`}
                style={
                    isOpen
                        ? { height: contentHeight.current?.scrollHeight }
                        : { height: "0px" }
                }
            >
                <p className="answer-content px-4 py-4">{subtitle}</p>
            </div>
        </div>
    );
};

const Accordion: React.FC<AccordionProps> = ({
    data,
    className,
    titleClassName,
    subtitleClassName
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleItemClick = (index: number) => {
        setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    return (
        <div className={`md:max-w-screen-lg w-full mx-auto ${className}`}>
            {data.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    subtitle={item.subtitle}
                    isOpen={activeIndex === index}
                    onClick={() => handleItemClick(index)}
                    titleClassName={titleClassName}
                    subtitleClassName={subtitleClassName}
                />
            ))}
        </div>
    );
};

export default Accordion;
