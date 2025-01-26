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
var LanguageContext_1 = require("@/contexts/LanguageContext");
var link_1 = require("next/link");
var phrases_1 = require("@/utils/phrases");
var OtherTranslateComponent_1 = require("./OtherTranslateComponent");
var react_1 = require("react");
var moment_1 = require("moment");
var material_1 = require("@mui/material");
var ModalStyles_1 = require("@/styles/ModalStyles");
var lucide_react_1 = require("lucide-react");
var image_1 = require("next/image");
var urls_1 = require("@/utils/urls");
var ListOfChaptersComponent = function (_a) {
    var webnovel = _a.webnovel, sortToggle = _a.sortToggle, onUpdate = _a.onUpdate;
    var _b = LanguageContext_1.useLanguage(), dictionary = _b.dictionary, language = _b.language;
    var _c = react_1.useState(0), key = _c[0], setKey = _c[1];
    var _d = react_1.useState(false), showDeleteModal = _d[0], setShowDeleteModal = _d[1];
    var _e = react_1.useState(null), deleteChapterId = _e[0], setDeleteChapterId = _e[1];
    var _f = react_1.useState(false), showMoreChapters = _f[0], setShowMoreChapters = _f[1];
    var _g = react_1.useState(10), visibleChapters = _g[0], setVisibleChapters = _g[1]; // Initial number of visible chapters
    var CHAPTERS_PER_PAGE = 10; // Number of chapters to show per click
    var sortedChapters = sortToggle ? webnovel === null || webnovel === void 0 ? void 0 : webnovel.chapters.sort(function (a, b) { return b.id - a.id; }) : webnovel === null || webnovel === void 0 ? void 0 : webnovel.chapters.sort(function (a, b) { return a.id - b.id; });
    var displayedChapters = (sortedChapters === null || sortedChapters === void 0 ? void 0 : sortedChapters.slice(0, visibleChapters)) || [];
    var hasMoreChapters = sortedChapters ? sortedChapters.length > visibleChapters : false;
    var loadMoreChapters = function () {
        setVisibleChapters(function (prev) { return Math.min(prev + CHAPTERS_PER_PAGE, (sortedChapters === null || sortedChapters === void 0 ? void 0 : sortedChapters.length) || 0); });
    };
    react_1.useEffect(function () {
        setKey(function (prevKey) { return prevKey + 1; });
    }, [language]);
    var handleChapterDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/delete_chapter?id=" + id)];
                case 1:
                    res = _a.sent();
                    if (res.ok) {
                        setShowDeleteModal(false);
                        setTimeout(function () {
                            window.location.href = "/view_webnovels?id=" + (webnovel === null || webnovel === void 0 ? void 0 : webnovel.id);
                        }, 100);
                    }
                    else {
                        console.error('Failed to delete chapter');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error deleting chapter:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "w-full" },
            React.createElement("div", { className: "overflow-y-auto rounded-md" }, displayedChapters.map(function (chapter, index) { return (React.createElement(link_1["default"], { href: "/chapter_view/" + chapter.id, key: "chapter-" + chapter.id, className: "block py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0 cursor-pointer\n                           " },
                React.createElement("div", { className: "flex flex-row justify-between items-center" },
                    React.createElement("div", { className: "flex flex-row gap-3 items-center" },
                        React.createElement("div", { className: "min-w-[50px] max-w-[50px]" },
                            React.createElement(image_1["default"], { src: urls_1.getImageUrl(webnovel === null || webnovel === void 0 ? void 0 : webnovel.cover_art), alt: (webnovel === null || webnovel === void 0 ? void 0 : webnovel.title) || '', width: 50, height: 50, className: "rounded-lg object-cover w-full" })),
                        React.createElement("div", { className: "flex flex-col text-sm" },
                            React.createElement("div", { className: "flex flex-row" },
                                React.createElement(OtherTranslateComponent_1["default"], { content: chapter.title, elementId: chapter.id.toString(), elementType: "chapter", classParams: "text-[14px]w-full truncate whitespace-nowrap text-black dark:text-white" })),
                            React.createElement("p", { className: "text-[11px] text-gray-500" }, moment_1["default"](new Date(chapter.created_at)).format('YYYY/MM/DD')),
                            React.createElement("div", { className: "flex flex-row space-x-2 text-sm" },
                                React.createElement("div", { className: 'flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white ' },
                                    React.createElement(lucide_react_1.Eye, { size: 11 }),
                                    " ",
                                    chapter.views),
                                React.createElement("div", { className: 'flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white ' },
                                    React.createElement("svg", { width: "10", height: "9", viewBox: "0 0 10 9", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
                                        React.createElement("path", { d: "M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z", fill: "#6B7280" })),
                                    chapter.upvotes),
                                React.createElement("div", { className: 'flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white ' },
                                    React.createElement(lucide_react_1.MessageCircle, { size: 11 }),
                                    " ",
                                    chapter.comments.length)))),
                    React.createElement("div", { className: "flex flex-row gap-2 items-center" },
                        React.createElement("div", { className: "text-gray-600 text-[10px] bg-gray-200 rounded-md px-1" }, phrases_1.phrase(dictionary, "readingForFree", language)))))); })),
            hasMoreChapters && (React.createElement("button", { className: "mt-4 w-full text-black dark:text-white rounded-xl p-2 text-sm flex flex-row gap-2 items-center justify-center", onClick: loadMoreChapters },
                showMoreChapters ? phrases_1.phrase(dictionary, "less", language) : phrases_1.phrase(dictionary, "more", language),
                showMoreChapters ? React.createElement(lucide_react_1.ChevronUpIcon, { size: 16, className: "text-black dark:text-white" }) : React.createElement(lucide_react_1.ChevronDownIcon, { size: 16, className: "text-black dark:text-white" })))),
        React.createElement(material_1.Modal, { open: showDeleteModal, onClose: function () { return setShowDeleteModal(false); } },
            React.createElement(material_1.Box, { sx: ModalStyles_1.useModalStyle },
                React.createElement("div", { className: "flex flex-col space-y-4 items-center justify-center" },
                    React.createElement("p", { className: "text-lg font-bold" }, phrases_1.phrase(dictionary, "deleteChapterConfirm", language)),
                    React.createElement(material_1.Button, { variant: "contained", color: "error", onClick: function () { return handleChapterDelete(deleteChapterId); } }, phrases_1.phrase(dictionary, "yes", language)),
                    React.createElement(material_1.Button, { variant: "outlined", onClick: function () { return setShowDeleteModal(false); } }, phrases_1.phrase(dictionary, "no", language)))))));
};
exports["default"] = ListOfChaptersComponent;
