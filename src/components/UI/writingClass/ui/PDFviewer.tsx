import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import pdfjs-dist with no SSR
const PDFViewer = ({ pdfUrl, language, isLoggedIn }: { pdfUrl: string, language: string, isLoggedIn?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfDoc, setPdfDoc] = useState<{ numPages: number; getPage: (num: number) => Promise<any> } | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [pageRendering, setPageRendering] = useState(false);
    const [pageNumPending, setPageNumPending] = useState<number | null>(null);
    const [scale, setScale] = useState(1.5);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchMatches, setSearchMatches] = useState<{
        itemIndex: number;
        matchIndex: number;
        text: string;
        transform: number[];
        width: number;
        height: number;
    }[]>([]);
    const [currentMatch, setCurrentMatch] = useState(-1);
    const [isBlurred, setIsBlurred] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    // Initialize PDF.js
    useEffect(() => {
        let pdfjsLib: any;

        const initPdf = async () => {
            // Dynamically import pdfjs-dist
            pdfjsLib = await import('pdfjs-dist');

            // Set the worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/build/pdf.worker.min.mjs`;

            // Load the PDF document
            try {
                const newPdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
                setPdfDoc(newPdfDoc);
                setPageCount(newPdfDoc.numPages);
                renderPage(1, newPdfDoc);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };

        initPdf();

        // Setup fullscreen change event
        const fullscreenChangeHandler = () => {
            setIsFullscreen(
                !!(document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement)
            );
        };

        document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);

        return () => {
            document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler);
        };
    }, [pdfUrl]);

    const renderPage = (num: number, doc: any) => {
        if (!doc) return;

        setPageRendering(true);

        // Using the current doc
        doc.getPage(num).then((page: any) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Apply rotation to viewport
            const viewport = page.getViewport({
                scale,
                rotation
            });

            // Set canvas dimensions to match the viewport
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render the PDF page
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                setPageRendering(false);

                if (pageNumPending !== null) {
                    renderPage(pageNumPending, doc);
                    setPageNumPending(null);
                } else if (searchMatches.length > 0 && currentMatch >= 0) {
                    highlightSearchMatch();
                }
            });
        });

        setPageNum(num);
    };

    const queueRenderPage = (num: number, doc: any) => {
        if (pageRendering) {
            setPageNumPending(num);
        } else {
            renderPage(num, doc);
        }
    };

    const onPrevPage = () => {
        if (pageNum <= 1) return;
        if (!isLoggedIn && pageNum - 1 > 5) return;
        queueRenderPage(pageNum - 1, pdfDoc);
    };

    const onNextPage = () => {
        if (pageNum >= pageCount) return;
        if (!isLoggedIn && pageNum + 1 > 5) {
            setIsBlurred(true);
            setShowWarning(true);
            return;
        }
        queueRenderPage(pageNum + 1, pdfDoc);
    };

    const handleZoomIn = () => {
        setScale(prevScale => {
            const newScale = prevScale + 0.25;
            renderPage(pageNum, pdfDoc);
            return newScale;
        });
    };

    const handleZoomOut = () => {
        setScale(prevScale => {
            const newScale = Math.max(0.5, prevScale - 0.25);
            renderPage(pageNum, pdfDoc);
            return newScale;
        });
    };

    const handleRotate = () => {
        setRotation(prevRotation => {
            const newRotation = (prevRotation + 90) % 360;
            renderPage(pageNum, pdfDoc);
            return newRotation;
        });
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;

        if (!isFullscreen) {
            if (container?.requestFullscreen) {
                container.requestFullscreen();
            } else if (container?.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container?.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container?.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    const handlePrint = () => {
        if (!pdfDoc) return;

        // Create a temporary iframe
        const printIframe = document.createElement('iframe');
        printIframe.style.display = 'none';
        document.body.appendChild(printIframe);

        const printDocument = printIframe.contentDocument;
        if (!printDocument) return;
        printDocument.write('<html><head><title>Print PDF</title></head><body>');

        // Add canvases for all pages
        const printPromises = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const printCanvas = document.createElement('canvas');
            printDocument.body.appendChild(printCanvas);

            printPromises.push(
                pdfDoc.getPage(i).then((page: any) => {
                    const viewport = page.getViewport({ scale: 1.5 });
                    printCanvas.height = viewport.height;
                    printCanvas.width = viewport.width;

                    return page.render({
                        canvasContext: printCanvas.getContext('2d'),
                        viewport
                    }).promise;
                })
            );
        }

        // When all pages are rendered, print
        Promise.all(printPromises).then(() => {
            printDocument.close();
            if (printIframe.contentWindow) {
                printIframe.contentWindow.focus();
                printIframe.contentWindow.print();
            }

            // Remove the iframe after printing (or after a timeout)
            setTimeout(() => {
                document.body.removeChild(printIframe);
            }, 1000);
        });
    };

    const handleSearch = async () => {
        if (!searchText || !pdfDoc) return;

        setSearchMatches([]);
        setCurrentMatch(-1);

        try {
            // Search for text in the current page
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();

            const textMatches: {
                itemIndex: number;
                matchIndex: number;
                text: string;
                transform: number[];
                width: number;
                height: number;
            }[] = [];

            textContent.items.forEach((item: { str: string; transform: number[]; width: number; height: number }, index: number) => {
                const itemText = item.str.toLowerCase();
                let matchIndex = 0;

                while ((matchIndex = itemText.indexOf(searchText.toLowerCase(), matchIndex)) !== -1) {
                    textMatches.push({
                        itemIndex: index,
                        matchIndex,
                        text: item.str.substr(matchIndex, searchText.length),
                        transform: item.transform,
                        width: item.width,
                        height: item.height
                    });

                    matchIndex += searchText.length;
                }
            });

            setSearchMatches(textMatches);

            if (textMatches.length > 0) {
                setCurrentMatch(0);
            }
        } catch (error) {
            console.error('Error searching PDF:', error);
        }
    };

    const highlightSearchMatch = () => {
        if (currentMatch < 0 || !searchMatches.length) return;

        const match = searchMatches[currentMatch];
        if (!match) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw highlight rectangle
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';

        // Calculate position based on text item transform
        const [a, b, c, d, e, f] = match.transform;
        const x = e;
        const y = f;

        // Get text dimensions
        const width = match.width || 100; // Fallback if width not available
        const height = 20; // Approximate text height

        // Draw the highlight
        ctx.fillRect(x, y - height + 5, width, height);
    };

    const navigateSearch = (direction: string) => {
        if (!searchMatches.length) return;

        let newMatch;
        if (direction === 'next') {
            newMatch = (currentMatch + 1) % searchMatches.length;
        } else {
            newMatch = (currentMatch - 1 + searchMatches.length) % searchMatches.length;
        }

        setCurrentMatch(newMatch);
        renderPage(pageNum, pdfDoc); // Re-render to clear previous highlight
    };

    useEffect(() => {
        if (searchMatches.length > 0 && currentMatch >= 0 && !pageRendering) {
            highlightSearchMatch();
        }
    }, [currentMatch, searchMatches]);

    // Jump to specific page
    const jumpToPage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const pageToJump = parseInt((e.target as HTMLFormElement).pageNumber.value);
        if (pageToJump && pageToJump > 0 && pageToJump <= pageCount) {
            if (!isLoggedIn && pageToJump > 5) {
                setIsBlurred(true);
                setShowWarning(true);
                queueRenderPage(5, pdfDoc);
            } else {
                queueRenderPage(pageToJump, pdfDoc);
            }
        }
        (e.target as HTMLFormElement).reset();
    };

    useEffect(() => {
        if (!isLoggedIn) {
            // Only show warning and blur if trying to access pages beyond 5
            if (pageNum > 5) {
                setIsBlurred(true);
                setShowWarning(true);
                queueRenderPage(5, pdfDoc);
            } else {
                setIsBlurred(false);
                setShowWarning(false);
            }
        } else {
            setIsBlurred(false);
            setShowWarning(false);
        }
    }, [isLoggedIn, pdfDoc, pageNum]);

    return (
        <div className="pdf-viewer" ref={containerRef}>
            <div className="toolbar">
                <div className="page-controls">
                    <button onClick={onPrevPage} disabled={pageNum <= 1}>
                        &lt;
                    </button>
                    <span className="page-info">
                        Page {pageNum} of {pageCount}
                    </span>
                    <button onClick={onNextPage} disabled={pageNum >= pageCount}>
                        &gt;
                    </button>

                    <form onSubmit={jumpToPage} className="jump-form">
                        <input
                            type="number"
                            name="pageNumber"
                            min="1"
                            max={pageCount}
                            placeholder="Go to page"
                        />
                        <button type="submit">Go</button>
                    </form>
                </div>

                <div className="view-controls">
                    <button onClick={handleZoomOut} title="Zoom Out">-</button>
                    <span>{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn} title="Zoom In">+</button>
                    <button onClick={handleRotate} title="Rotate">↻</button>
                    <button onClick={toggleFullscreen} title="Toggle Fullscreen">
                        {isFullscreen ? '↙' : '↗'}
                    </button>
                    {/* <button onClick={handlePrint} title="Print">🖨️</button> */}
                </div>

                <div className="search-controls">
                    {/* <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search text"
                    />
                    <button onClick={handleSearch}>Search</button>
                    {searchMatches.length > 0 && (
                        <>
                            <span>
                                {currentMatch + 1} of {searchMatches.length}
                            </span>
                            <button onClick={() => navigateSearch('prev')}>↑</button>
                            <button onClick={() => navigateSearch('next')}>↓</button>
                        </>
                    )} */}
                </div>
            </div>

            <div className="pdf-container">
                <canvas ref={canvasRef} className={isBlurred ? 'blurred' : ''}></canvas>
                {showWarning && (
                    <div className="warning-overlay">
                        <div className="warning-message">
                            {language === 'ko' ? '로그인 후 전체 내용을 볼 수 있습니다.' 
                                               : 'Please login to view the full content'}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .pdf-viewer {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: ${isFullscreen ? '100vh' : 'auto'};
                background-color: ${isFullscreen ? '#404040' : 'transparent'};
                }
                
                .toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                padding: 10px;
                background: #f0f0f0;
                border-bottom: 1px solid #ddd;
                justify-content: space-between;
                }
                
                .page-controls, .view-controls, .search-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                }
                
                .page-info {
                white-space: nowrap;
                }
                
                .jump-form {
                display: flex;
                gap: 4px;
                }
                
                .jump-form input {
                width: 80px;
                padding: 4px;
                }
                
                button {
                padding: 6px 10px;
                background: #0070f3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                }
                
                button:disabled {
                background: #cccccc;
                cursor: not-allowed;
                }
                
                input {
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                }
                
                .pdf-container {
                overflow: auto;
                flex-grow: 1;
                display: flex;
                justify-content: start;
                padding: 20px;
                background-color: ${isFullscreen ? '#404040' : '#f9f9f9'};
                position: relative;
                }
                
                canvas {
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                background-color: white;
                }
                
                .blurred {
                    filter: blur(8px);
                }

                .warning-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    pointer-events: none;
                }

                .warning-message {
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 8px;
                    font-size: 24px;
                    font-weight: bold;
                }
                
                @media (max-width: 768px) {
                .toolbar {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .page-controls, .view-controls, .search-controls {
                    justify-content: center;
                }
                }
            `}</style>
        </div>
    );
};

// Export a client-side only version of the component
export default dynamic(() => Promise.resolve(PDFViewer), {
    ssr: false
});