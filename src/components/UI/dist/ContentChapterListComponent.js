'use client';
"use strict";
exports.__esModule = true;
var react_1 = require("react");
var material_1 = require("@mui/material");
var Tab_1 = require("@mui/material/Tab");
var TabContext_1 = require("@mui/lab/TabContext");
var TabList_1 = require("@mui/lab/TabList");
var TabPanel_1 = require("@mui/lab/TabPanel");
var material_2 = require("@mui/material");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var phrases_1 = require("@/utils/phrases");
var WebtoonChapterListSubcomponent_1 = require("@/components/WebtoonChapterListSubcomponent");
var lucide_react_1 = require("lucide-react");
var image_1 = require("next/image");
var Tooltip_1 = require("@mui/material/Tooltip");
var moment_1 = require("moment");
var react_share_1 = require("react-share");
var CommentList_1 = require("@/components/CommentList");
var ListOfChaptersComponent_1 = require("@/components/ListOfChaptersComponent");
var AuthorWorkListComponent_1 = require("@/components/AuthorWorkListComponent");
var ContentChapterListComponent = function (_a) {
    var _b, _c;
    var content = _a.content, _d = _a.slug, slug = _d === void 0 ? "" : _d, coverArt = _a.coverArt, _e = _a.relatedContent, relatedContent = _e === void 0 ? [] : _e, _f = _a.coverArtUrls, coverArtUrls = _f === void 0 ? [] : _f, _g = _a.isWebtoon, isWebtoon = _g === void 0 ? false : _g, onContentUpdate = _a.onContentUpdate;
    var _h = react_1.useState(true), isSortedByLatest = _h[0], setIsSortedByLatest = _h[1];
    var _j = react_1.useState('1'), tabValue = _j[0], setTabValue = _j[1];
    var _k = LanguageContext_1.useLanguage(), dictionary = _k.dictionary, language = _k.language;
    var _l = react_1.useState(''), currentPageUrl = _l[0], setCurrentPageUrl = _l[1];
    var formattedDate = (content === null || content === void 0 ? void 0 : content.created_at) ? moment_1["default"](new Date(content.created_at)).format('MM/DD/YYYY')
        : '';
    var handleChange = function (event, newValue) {
        setTabValue(newValue);
    };
    var handleSortToggle = function () {
        setIsSortedByLatest(function (prev) { return !prev; });
    };
    var chapterCount = ((_b = content === null || content === void 0 ? void 0 : content.chapters) === null || _b === void 0 ? void 0 : _b.length) || 0;
    return (React.createElement("div", { className: "flex flex-col w-full md:overflow-auto overflow-x-hidden" },
        React.createElement(TabContext_1["default"], { value: tabValue },
            React.createElement(material_2.Box, { sx: {
                    borderBottom: 1,
                    borderColor: 'divider',
                    padding: {
                        xs: '20px 10px',
                        sm: 0 // padding for larger screens
                    }
                }, className: 'dark:text-gray-700 dark:border-gray-700' },
                React.createElement("div", { className: "flex flex-row justify-between items-center" },
                    React.createElement(TabList_1["default"], { onChange: handleChange, "aria-label": "lab API tabs", sx: {
                            '& .MuiTab-root': {
                                marginLeft: '10px',
                                padding: '0 10px',
                                color: 'gray',
                                '&.Mui-selected': {
                                    color: '#DB2777'
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: 'transparent'
                            }
                        }, className: "first-line:dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#DB2777]" },
                        React.createElement(Tab_1["default"], { label: React.createElement("div", { className: "flex flex-row items-center gap-1" },
                                React.createElement("span", { className: "flex flex-row items-center gap-1" },
                                    React.createElement(lucide_react_1.AlignLeft, { size: 16 }),
                                    phrases_1.phrase(dictionary, "episodes", language)),
                                React.createElement("span", { className: "" }, chapterCount)), value: "1", className: "dark:text-white \n                                 dark:focus:text-[#DB2777]\n                                 dark:active:text-[#DB2777]\n                                " }),
                        React.createElement(Tab_1["default"], { label: React.createElement(React.Fragment, null,
                                React.createElement("span", { className: "flex flex-row items-center gap-1" },
                                    React.createElement(lucide_react_1.FileText, { size: 16 }),
                                    " ",
                                    phrases_1.phrase(dictionary, "description", language))), value: "2", className: "dark:text-white  dark:focus:text-[#DB2777] dark:active:text-[#DB2777]\n                                md:w-auto sm:w-[10px]\n                                " })),
                    React.createElement("div", { className: 'self-center text-sm' },
                        React.createElement(material_1.Button, { sx: {
                                color: 'gray',
                                backgroundColor: 'transparent'
                            }, variant: "text", onClick: handleSortToggle, className: "bg-transparent text-black dark:text-white \n                                            hover:text-[#DB2777] dark:hover:text-[#DB2777] \n                                            px-2 py-1 rounded-md flex flex-row items-center gap-2" },
                            React.createElement(lucide_react_1.ArrowDownUp, { size: 16, className: "text-gray-500 group-hover:text-white self-center" }),
                            React.createElement("span", { className: "hidden md:flex" }, phrases_1.phrase(dictionary, isSortedByLatest ? "sort_latest" : "sort_oldest", language)))))),
            React.createElement(TabPanel_1["default"], { value: "1", sx: {
                    height: '100%',
                    padding: {
                        xs: '16px',
                        sm: '16px' // padding for desktop (0 horizontal padding)
                    },
                    '& .MuiTabPanel-root': {
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start'
                    }
                } },
                React.createElement("div", { className: "flex flex-col self-start justify-start" },
                    React.createElement("div", { className: "flex flex-col w-full gap-3" },
                        React.createElement(Tooltip_1["default"], { title: phrases_1.phrase(dictionary, "preparing", language), followCursor: true },
                            React.createElement(material_1.Button, { variant: 'text', className: "flex flex-row justify-between items-center gap-2 text-sm text-black dark:text-white bg-gray-100 dark:bg-gray-900 rounded-md py-3" },
                                React.createElement("p", { className: "text-sm flex flex-row items-center gap-2" },
                                    React.createElement(image_1["default"], { src: "/images/N_logo.svg", alt: "Toonyz Logo", width: 0, height: 0, sizes: "100vh", style: {
                                            height: '20px',
                                            width: '20px',
                                            padding: '2px',
                                            justifyContent: 'center',
                                            alignSelf: 'center',
                                            borderRadius: '25%',
                                            border: '1px solid #eee',
                                            backgroundColor: 'white'
                                        } }),
                                    phrases_1.phrase(dictionary, "binge_with_bulk_unlock", language)),
                                React.createElement(lucide_react_1.ChevronRightIcon, { size: 16, className: "text-black dark:text-white" }))),
                        content && content.chapters ? (isWebtoon ? (React.createElement(WebtoonChapterListSubcomponent_1["default"], { webtoon: content, slug: slug, coverArt: coverArt, sortToggle: isSortedByLatest, onUpdate: onContentUpdate })) : (React.createElement(ListOfChaptersComponent_1["default"], { webnovel: content, sortToggle: isSortedByLatest, onUpdate: onContentUpdate }))) : (React.createElement("div", null, "No chapters available")),
                        content && content.user && relatedContent && relatedContent.length > 0 && (React.createElement(React.Fragment, null,
                            React.createElement("h1", { className: "text-base font-bold" }, phrases_1.phrase(dictionary, "authorWorkList", language)),
                            React.createElement("hr", null),
                            React.createElement("div", { className: "relative flex flex-col w-full overflow-hidden" },
                                React.createElement(AuthorWorkListComponent_1["default"], { webnovels: relatedContent, nickname: content.user.nickname })))),
                        content && content.chapters && content.chapters.length > 0 ? (React.createElement(CommentList_1.CommentList, { content: content, chapter: content.chapters[0], webnovelOrWebtoon: !isWebtoon })) : (React.createElement("div", { className: "flex flex-col items-center justify-center py-8" },
                            React.createElement("p", { className: "text-gray-500 text-sm" }, phrases_1.phrase(dictionary, "noComments", language))))))),
            React.createElement(TabPanel_1["default"], { value: "2", sx: {
                    height: '100%',
                    padding: {
                        xs: '16px',
                        sm: '16px' // padding for desktop (0 horizontal padding)
                    },
                    '& .MuiTabPanel-root': {
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start'
                    }
                } }, content ? (React.createElement("div", { className: "flex flex-col self-start justify-start gap-4 space-y-4" },
                React.createElement("p", { className: "text-sm text-black dark:text-white" }, content.description || "No description available"),
                React.createElement("div", { className: "flex flex-col gap-0 space-y-4" },
                    React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "created_at", language)),
                    React.createElement("p", { className: "text-sm capitalize" },
                        React.createElement("p", { className: "text-sm text-black dark:text-white" },
                            " ",
                            formattedDate,
                            " ")),
                    React.createElement("hr", null),
                    React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "language", language)),
                    React.createElement("p", { className: "text-sm capitalize" }, (_c = content === null || content === void 0 ? void 0 : content.language) === null || _c === void 0 ? void 0 : _c.toLowerCase()),
                    React.createElement("hr", null),
                    React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "views", language)),
                    React.createElement("p", { className: "text-sm capitalize" }, content.views),
                    React.createElement("hr", null),
                    React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "likes", language)),
                    React.createElement("p", { className: "text-sm capitalize" }, content.upvotes),
                    React.createElement("hr", null),
                    React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "share", language)),
                    React.createElement("div", { className: "flex flex-row gap-2" },
                        React.createElement(react_share_1.FacebookShareButton, { url: currentPageUrl, title: content.title },
                            React.createElement(react_share_1.FacebookIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                        React.createElement(react_share_1.TwitterShareButton, { url: currentPageUrl, title: content.title },
                            React.createElement(react_share_1.TwitterIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                        React.createElement(react_share_1.TumblrShareButton, { url: currentPageUrl, title: content.title },
                            React.createElement(react_share_1.TumblrIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                        React.createElement(react_share_1.TelegramShareButton, { url: currentPageUrl, title: content.title },
                            React.createElement(react_share_1.TelegramIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                        React.createElement(react_share_1.WhatsappShareButton, { url: currentPageUrl, title: content.title },
                            React.createElement(react_share_1.WhatsappIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                        React.createElement(react_share_1.PinterestShareButton, { url: currentPageUrl, title: content.title, media: content.cover_art || "" },
                            React.createElement(react_share_1.PinterestIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })))))) : (React.createElement("div", { className: "flex flex-col items-center justify-center py-8" },
                React.createElement("p", { className: "text-gray-500 text-sm" }, phrases_1.phrase(dictionary, "contentNotAvailable", language))))))));
};
exports["default"] = ContentChapterListComponent;
