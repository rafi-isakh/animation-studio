"use client";
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var image_1 = require("next/image");
var phrases_1 = require("@/utils/phrases");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var link_1 = require("next/link");
var react_1 = require("react");
var OtherTranslateComponent_1 = require("./OtherTranslateComponent");
function WebtoonRecommendationsComponent(_a) {
    var webtoons = _a.webtoons, coverArtUrls = _a.coverArtUrls;
    var _b = LanguageContext_1.useLanguage(), dictionary = _b.dictionary, language = _b.language;
    var _c = react_1.useState([]), recommendedWebtoons = _c[0], setRecommendedWebtoons = _c[1];
    var _d = react_1.useState([]), recommendedCoverArtUrls = _d[0], setRecommendedCoverArtUrls = _d[1];
    var _e = react_1.useState(0), key = _e[0], setKey = _e[1];
    var getRecommendations = function (webtoons) {
        var _a, _b;
        // Get a copy of the array to avoid mutating the original
        var shuffled = __spreadArrays(webtoons);
        var shuffledUrls = __spreadArrays(coverArtUrls);
        // Fisher-Yates shuffle algorithm
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [shuffled[j], shuffled[i]], shuffled[i] = _a[0], shuffled[j] = _a[1];
            _b = [shuffledUrls[j], shuffledUrls[i]], shuffledUrls[i] = _b[0], shuffledUrls[j] = _b[1];
        }
        // Return first 10 items (or all if less than 10)
        return { webtoons: shuffled.slice(0, 10), coverArtUrls: shuffledUrls.slice(0, 10) };
    };
    react_1.useEffect(function () {
        var _a = getRecommendations(webtoons), recommendedWebtoons = _a.webtoons, recommendedCoverArtUrls = _a.coverArtUrls;
        setRecommendedWebtoons(recommendedWebtoons);
        setRecommendedCoverArtUrls(recommendedCoverArtUrls);
    }, [webtoons]);
    var truncateText = function (text, maxLength) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };
    return (React.createElement("div", { className: "md:w-[670px] w-full " },
        React.createElement("div", { className: "flex flex-row gap-1 overflow-x-auto" }, recommendedWebtoons.map(function (webtoon, index) { return (React.createElement(link_1["default"], { href: "/webtoons/" + webtoon.id, key: "webtoon-" + webtoon.id, className: "cursor-pointer block py-2 min-w-[150px] max-w-[150px]" },
            React.createElement("div", { className: "flex flex-col dark:text-white hover:opacity-80 transition duration-150 ease-in-out rounded-sm h-full" },
                React.createElement("div", { className: "w-[150px] h-[200px] relative" },
                    React.createElement(image_1["default"], { src: recommendedCoverArtUrls[index], alt: webtoon.title, className: "rounded-lg object-cover", fill: true, sizes: "150px" })),
                React.createElement("div", { className: "flex flex-row justify-between items-center w-full mt-2" },
                    React.createElement("div", { className: "ml-3 flex flex-col gap-1 text-sm truncate" },
                        React.createElement(OtherTranslateComponent_1["default"], { content: truncateText(webtoon.title, 20), elementId: webtoon.id.toString(), elementType: "webtoon", elementSubtype: "title" }),
                        React.createElement("div", { className: "flex flex-row gap-1 flex-shrink-0 flex-grow-0 whitespace-nowrap" },
                            React.createElement("span", { className: "text-gray-600 text-[10px] flex-shrink-0 " }, phrases_1.phrase(dictionary, webtoon.genre.toLowerCase(), language)),
                            React.createElement("span", { className: "text-gray-600 text-[10px] max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap inline-block" }, webtoon.user.nickname))))))); }))));
}
exports["default"] = WebtoonRecommendationsComponent;
