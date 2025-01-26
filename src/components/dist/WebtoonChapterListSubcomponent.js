'use client';
"use strict";
exports.__esModule = true;
var react_1 = require("react");
var link_1 = require("next/link");
require("@/styles/Webtoons.module.css");
var material_1 = require("@mui/material");
var image_1 = require("next/image");
var phrases_1 = require("@/utils/phrases");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var lucide_react_1 = require("lucide-react");
var ModalStyles_1 = require("@/styles/ModalStyles");
var md_1 = require("react-icons/md");
var UserContext_1 = require("@/contexts/UserContext");
var WebtoonChapterListSubcomponent = function (_a) {
    var webtoon = _a.webtoon, slug = _a.slug, coverArt = _a.coverArt, sortToggle = _a.sortToggle, onUpdate = _a.onUpdate;
    var _b = react_1.useState(false), showMoreChapters = _b[0], setShowMoreChapters = _b[1];
    var _c = react_1.useState(false), showLessChapters = _c[0], setShowLessChapters = _c[1];
    var _d = react_1.useState(false), showModal = _d[0], setShowModal = _d[1];
    var _e = react_1.useState(null), selectedChapter = _e[0], setSelectedChapter = _e[1];
    var _f = LanguageContext_1.useLanguage(), language = _f.language, dictionary = _f.dictionary;
    var stars = UserContext_1.useUser().stars;
    var sortedChapters = sortToggle ? webtoon.chapters.sort(function (a, b) { return b.id - a.id; }) : webtoon.chapters.sort(function (a, b) { return a.id - b.id; });
    console.log(webtoon.chapters.map(function (chapter) { return chapter.free; }));
    var handleChapterClick = function (chapter, e) {
        if (chapter.free) {
            return true;
        }
        else {
            e.preventDefault();
            setSelectedChapter(chapter);
            onOpenPurchaseModal();
            return false;
        }
    };
    var onOpenPurchaseModal = function () {
        setShowModal(true);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "w-full" },
            React.createElement("div", { className: "overflow-y-auto rounded-md" }, sortedChapters.map(function (chapter, index) { return (React.createElement(link_1["default"], { href: "/webtoons/" + slug + "/" + chapter.directory, key: "chapter-" + chapter.id, onClick: function (e) { return handleChapterClick(chapter, e); }, className: "cursor-pointer block py-2 border-b border-gray-200 last:border-b-0 \n              " + (index >= 10 && !showMoreChapters ? 'hidden' : '') + "\n              " + (!chapter.free ? 'opacity-50' : '') },
                React.createElement("div", { className: "flex flex-row justify-between" },
                    React.createElement("div", { className: "flex flex-row gap-3" },
                        React.createElement(image_1["default"], { src: coverArt, alt: chapter.directory, className: "object-cover ", width: 50, height: 50 }),
                        React.createElement("p", { className: "text-sm text-center self-center" }, language === 'en' ? "Episode " + parseInt(chapter.directory) :
                            language === 'ko' ? parseInt(chapter.directory) + "\uD654" :
                                "Episode " + parseInt(chapter.directory) + " ")),
                    React.createElement("div", { className: "text-sm text-center self-center" },
                        React.createElement("div", { className: "text-gray-600 text-[10px] bg-gray-200 rounded-md px-1" }, chapter.free ? phrases_1.phrase(dictionary, "readingForFree", language)
                            : React.createElement("div", { className: "flex flex-row gap-1 items-center" },
                                " ",
                                React.createElement(md_1.MdStars, { className: "text-sm text-[#D92979]" }),
                                " 30")))))); })),
            (webtoon === null || webtoon === void 0 ? void 0 : webtoon.chapters) && (webtoon === null || webtoon === void 0 ? void 0 : webtoon.chapters.length) > 8 && (React.createElement("button", { className: "mt-4 w-full text-black dark:text-white rounded-xl p-2 text-sm flex flex-row gap-2 items-center justify-center", onClick: function () { return setShowMoreChapters(!showMoreChapters); } },
                showMoreChapters ? phrases_1.phrase(dictionary, "less", language) : phrases_1.phrase(dictionary, "more", language),
                showMoreChapters ? React.createElement(lucide_react_1.ChevronUpIcon, { size: 16, className: "text-black dark:text-white" }) : React.createElement(lucide_react_1.ChevronDownIcon, { size: 16, className: "text-black dark:text-white" })))),
        React.createElement(material_1.Modal, { open: showModal, onClose: function () { return setShowModal(false); } },
            React.createElement(material_1.Box, { sx: ModalStyles_1.useModalStyle },
                React.createElement("div", { className: 'flex flex-col space-y-4 items-center justify-cente' },
                    React.createElement("p", { className: 'text-lg font-bold text-black dark:text-black' }, phrases_1.phrase(dictionary, "purchase", language)),
                    React.createElement("p", null,
                        webtoon.title,
                        " ",
                        language === 'en' ? "Episode " + parseInt((selectedChapter === null || selectedChapter === void 0 ? void 0 : selectedChapter.directory) || '0') :
                            language === 'ko' ? parseInt((selectedChapter === null || selectedChapter === void 0 ? void 0 : selectedChapter.directory) || '0') + "\uD654" :
                                "Episode " + parseInt((selectedChapter === null || selectedChapter === void 0 ? void 0 : selectedChapter.directory) || '0') + " "),
                    React.createElement("p", null,
                        "\uBCF4\uC720\uD55C \uD22C\uB2C8\uC988 \uBCC4 ",
                        stars,
                        "\uAC1C"),
                    React.createElement("hr", { className: 'w-full' }),
                    React.createElement("div", { className: "flex flex-row gap-2 " },
                        React.createElement(material_1.Tooltip, { title: phrases_1.phrase(dictionary, "preparing", language), followCursor: true },
                            React.createElement(material_1.Button, null, phrases_1.phrase(dictionary, "purchase", language))),
                        React.createElement(material_1.Tooltip, { title: phrases_1.phrase(dictionary, "preparing", language), followCursor: true },
                            React.createElement(link_1["default"], { href: "#" },
                                React.createElement(material_1.Button, { color: 'gray', variant: 'outlined', className: 'w-32 dark:text-white bg-[#DB2777] text-white' }, phrases_1.phrase(dictionary, "stars", language))))))))));
};
exports["default"] = WebtoonChapterListSubcomponent;
