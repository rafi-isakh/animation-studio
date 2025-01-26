"use strict";
exports.__esModule = true;
var link_1 = require("next/link");
var phrases_1 = require("@/utils/phrases");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var OtherTranslateComponent_1 = require("@/components/OtherTranslateComponent");
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var image_1 = require("next/image");
var urls_1 = require("@/utils/urls");
var AuthorWorkListComponent = function (_a) {
    var webnovels = _a.webnovels, nickname = _a.nickname;
    var _b = LanguageContext_1.useLanguage(), language = _b.language, dictionary = _b.dictionary;
    var _c = react_1.useState(0), key = _c[0], setKey = _c[1];
    var params = navigation_1.useSearchParams();
    react_1.useEffect(function () {
        setKey(function (prevKey) { return prevKey + 1; });
    }, [params, language]);
    var truncateText = function (text, maxLength) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };
    return (React.createElement("div", { className: "md:w-[670px] w-full" },
        React.createElement("div", { className: "flex flex-row gap-1 overflow-x-auto" }, webnovels === null || webnovels === void 0 ? void 0 : webnovels.map(function (webnovel, index) { return (React.createElement("div", { key: index, className: "flex-shrink-1" },
            React.createElement(link_1["default"], { href: "/view_webnovels?id=" + webnovel.id, className: "cursor-pointer block py-2 min-w-[150px] max-w-[150px] mx-2 first:ml-0 last:mr-0" },
                React.createElement("div", { className: "flex flex-col dark:text-white hover:opacity-80 transition duration-150 ease-in-out rounded-sm h-full" },
                    React.createElement("div", { className: "w-[150px] h-[200px] relative" },
                        React.createElement(image_1["default"], { src: urls_1.getImageUrl(webnovel.cover_art), alt: webnovel.title, className: "rounded-lg object-cover", fill: true, sizes: "150px" })),
                    React.createElement("div", { className: "flex flex-row justify-between items-center w-full mt-2" },
                        React.createElement("div", { className: "ml-3 flex flex-col gap-1 text-sm truncate" },
                            React.createElement(OtherTranslateComponent_1["default"], { content: truncateText(webnovel.title, 20), elementId: webnovel.id.toString(), elementType: 'webnovel', elementSubtype: "title" }),
                            React.createElement("div", { className: "flex flex-row gap-1 flex-shrink-0 flex-grow-0 whitespace-nowrap" },
                                React.createElement("span", { className: "text-gray-600 text-[10px] flex-shrink-0 " }, phrases_1.phrase(dictionary, webnovel.genre.toLowerCase(), language))))))))); }))));
};
exports["default"] = AuthorWorkListComponent;
