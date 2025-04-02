export const formatTitle = (str: string): string => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


export const getUrlWithParams = (paramKey: string, paramValue: string, pathname: string, searchParams: URLSearchParams) => {
    const params = new URLSearchParams(searchParams);
    params.set(paramKey, paramValue);
    return `${pathname}?${params.toString()}`;
};

export function parseHtmlToText(htmlString: string) {
    // Create a new DOM parser
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, "text/html");

    // Remove unwanted tags like styles and scripts
    doc.querySelectorAll("style, script").forEach(el => el.remove());

    // Extract plain text
    let textContent = doc.body.textContent || doc.body.innerText;

    // Remove excessive new lines and trim spaces
    textContent = textContent.replace(/\s{3,}/g, "\n").trim();

    return textContent;
}