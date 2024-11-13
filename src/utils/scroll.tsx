export const scroll = (direction: 'left' | 'right', containerRef: React.RefObject<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
        const scrollAmount = 200 * (direction === 'right' ? 1 : -1);
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
};