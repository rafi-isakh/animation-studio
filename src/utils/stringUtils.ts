export const formatTitle = (str: string): string => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


export const getUrlWithParams = (paramKey: string, paramValue: string, pathname: string, searchParams: URLSearchParams) => {
        const params = new URLSearchParams(searchParams);
        params.set(paramKey, paramValue);
        return `${pathname}?${params.toString()}`;
    };