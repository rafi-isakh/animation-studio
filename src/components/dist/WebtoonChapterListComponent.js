'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var WebtoonRecommendationsComponent_1 = require("@/components/WebtoonRecommendationsComponent");
var moment_1 = require("moment");
var react_share_1 = require("react-share");
var CommentList_1 = require("@/components/CommentList");
var marked_1 = require("marked");
var WebtoonChapterListComponent = function (_a) {
    var webtoons = _a.webtoons, coverArtUrls = _a.coverArtUrls, webtoon = _a.webtoon, slug = _a.slug, coverArt = _a.coverArt, onUpdate = _a.onUpdate;
    var _b = react_1.useState('1'), tabValue = _b[0], setTabValue = _b[1];
    var _c = LanguageContext_1.useLanguage(), dictionary = _c.dictionary, language = _c.language;
    var _d = react_1.useState(false), isSortedByLatest = _d[0], setIsSortedByLatest = _d[1];
    var formattedDate = moment_1["default"](webtoon.created_at).format('MM/DD/YYYY');
    var _e = react_1.useState(''), currentPageUrl = _e[0], setCurrentPageUrl = _e[1];
    var _f = react_1.useState(''), markedDescription = _f[0], setMarkedDescription = _f[1];
    var handleUpdate = function () {
        if (onUpdate) {
            onUpdate(webtoon);
        }
    };
    react_1.useEffect(function () {
        if (window !== undefined) {
            setCurrentPageUrl(window.location.href);
        }
        var markDescription = function () { return __awaiter(void 0, void 0, void 0, function () {
            var markedDescription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, marked_1.marked(webtoon.description)];
                    case 1:
                        markedDescription = _a.sent();
                        setMarkedDescription(markedDescription);
                        return [2 /*return*/];
                }
            });
        }); };
        markDescription();
    }, []);
    var handleChange = function (event, newValue) {
        setTabValue(newValue);
    };
    var handleSortToggle = function () {
        setIsSortedByLatest(function (prev) { return !prev; });
    };
    return (React.createElement("div", { className: "flex flex-col flex-1 flex-shrink-0 w-full" },
        "  ",
        React.createElement(TabContext_1["default"], { value: tabValue },
            React.createElement(material_2.Box, { sx: {
                    borderBottom: 1,
                    borderColor: 'divider',
                    padding: {
                        xs: '20px 10px',
                        sm: 0 // padding for larger screens
                    }
                }, className: 'dark:text-gray-700' },
                React.createElement("div", { className: "flex flex-row justify-between items-center" },
                    React.createElement(TabList_1["default"], { onChange: handleChange, "aria-label": "lab API tabs", sx: {
                            '& .MuiTab-root': {
                                marginLeft: '10px',
                                padding: '0 10px',
                                // border: '1px solid #8A2BE2',
                                // borderRadius: '20px',
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
                                    " ",
                                    phrases_1.phrase(dictionary, "episodes", language)),
                                React.createElement("span", { className: "" }, webtoon.chapters.length)), value: "1", className: "dark:text-white dark:focus:text-[#DB2777] dark:active:text-[#DB2777]\n                                 md:w-auto sm:w-[10px]\n                                " }),
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
                        React.createElement(WebtoonChapterListSubcomponent_1["default"], { webtoon: webtoon, slug: slug, coverArt: coverArt, sortToggle: isSortedByLatest, onUpdate: handleUpdate }),
                        React.createElement("h1", { className: "text-base font-bold" }, phrases_1.phrase(dictionary, "youMightLikeThis", language)),
                        React.createElement("hr", null),
                        React.createElement("div", { className: "relative flex flex-col w-full overflow-hidden" },
                            React.createElement(WebtoonRecommendationsComponent_1["default"], { webtoons: webtoons, coverArtUrls: coverArtUrls })),
                        webtoon && React.createElement(CommentList_1.CommentList, { content: webtoon, chapter: webtoon.chapters[0], webnovelOrWebtoon: false })))),
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
                } },
                React.createElement("div", { className: "flex flex-col self-start justify-start gap-4 space-y-4" },
                    React.createElement("p", { className: "text-sm text-black dark:text-white", dangerouslySetInnerHTML: { __html: markedDescription } }),
                    React.createElement("div", { className: "flex flex-col gap-0 space-y-4" },
                        React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "created_at", language)),
                        React.createElement("p", { className: "text-sm capitalize" },
                            React.createElement("p", { className: "text-sm text-black dark:text-white" },
                                " ",
                                formattedDate,
                                " ")),
                        React.createElement("hr", null),
                        React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "language", language)),
                        React.createElement("p", { className: "text-sm capitalize" }, phrases_1.phrase(dictionary, webtoon.language.toLowerCase(), language)),
                        React.createElement("hr", null),
                        React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "views", language)),
                        React.createElement("p", { className: "text-sm capitalize" }, webtoon.views),
                        React.createElement("hr", null),
                        React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "likes", language)),
                        React.createElement("p", { className: "text-sm capitalize" }, webtoon.upvotes),
                        React.createElement("hr", null),
                        React.createElement("p", { className: "text-sm text-black dark:text-white font-bold" }, phrases_1.phrase(dictionary, "share", language)),
                        React.createElement("div", { className: "flex flex-row gap-2" },
                            React.createElement(react_share_1.FacebookShareButton, { url: currentPageUrl, title: webtoon.title },
                                React.createElement(react_share_1.FacebookIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                            React.createElement(react_share_1.TwitterShareButton, { url: currentPageUrl, title: webtoon.title },
                                React.createElement(react_share_1.TwitterIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                            React.createElement(react_share_1.TumblrShareButton, { url: currentPageUrl, title: webtoon.title },
                                React.createElement(react_share_1.TumblrIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                            React.createElement(react_share_1.TelegramShareButton, { url: currentPageUrl, title: webtoon.title },
                                React.createElement(react_share_1.TelegramIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                            React.createElement(react_share_1.WhatsappShareButton, { url: currentPageUrl, title: webtoon.title },
                                React.createElement(react_share_1.WhatsappIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })),
                            React.createElement(react_share_1.PinterestShareButton, { url: currentPageUrl, title: webtoon.title, media: webtoon.cover_art || "" },
                                React.createElement(react_share_1.PinterestIcon, { size: 22, className: "text-white rounded-full hover:opacity-80 transition duration-150 ease-in-out" })))))))));
};
exports["default"] = WebtoonChapterListComponent;
