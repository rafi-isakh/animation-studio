"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.free = exports.premium = void 0;
var react_1 = require("react");
var react_slick_1 = require("react-slick");
require("slick-carousel/slick/slick.css");
require("slick-carousel/slick/slick-theme.css");
var WebnovelComponent_1 = require("@/components/WebnovelComponent");
var phrases_1 = require("@/utils/phrases");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var lucide_react_1 = require("lucide-react");
var material_1 = require("@mui/material");
var webnovelUtils_1 = require("@/utils/webnovelUtils");
var lodash_1 = require("lodash");
exports.premium = [23, 19, 21, 22, 20, 24];
exports.free = [29, 28, 25];
var WebnovelsList = function (_a) {
    var searchParams = _a.searchParams, sortBy = _a.sortBy, webnovels = _a.webnovels;
    var genre = searchParams.genre;
    var version = searchParams.version;
    var _b = LanguageContext_1.useLanguage(), dictionary = _b.dictionary, language = _b.language;
    var _c = react_1.useState([]), webnovelsToShow = _c[0], setWebnovelsToShow = _c[1];
    var _d = react_1.useState([]), columns = _d[0], setColumns = _d[1];
    var scrollRef = react_1.useRef(null);
    var isMobile = material_1.useMediaQuery('(max-width: 768px)');
    var _e = react_1.useState(''), mobileGrid = _e[0], setMobileGrid = _e[1];
    var chunkedItems = lodash_1["default"].chunk(webnovels, 3);
    var settings = {
        dots: false,
        infinite: false,
        autoplay: false,
        slidesToShow: 3,
        slidesToScroll: 1,
        rows: 1,
        className: "center",
        centerMode: true,
        centerPadding: '30px',
        nextArrow: React.createElement(SampleNextArrow, null),
        prevArrow: React.createElement(SamplePrevArrow, null),
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    rows: 1
                }
            }
        ]
    };
    function SampleNextArrow(props) {
        var className = props.className, style = props.style, onClick = props.onClick;
        return (React.createElement("button", { onClick: onClick, className: 'absolute md:-right-5 -right-6 top-1/2 -translate-y-1/2 z-[99] rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 bg-white/80 ' },
            React.createElement(lucide_react_1.ChevronRight, { className: "w-6 h-6 text-gray/80" })));
    }
    function SamplePrevArrow(props) {
        var className = props.className, style = props.style, onClick = props.onClick;
        return (React.createElement("button", { onClick: onClick, className: "absolute md:left-5 left-3 top-1/2 -translate-y-1/2 z-[99] rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 bg-white/80 " },
            React.createElement(lucide_react_1.ChevronLeft, { className: "w-6 h-6 text-gray/80" })));
    }
    react_1.useEffect(function () {
        for (var _i = 0, webnovels_1 = webnovels; _i < webnovels_1.length; _i++) {
            var novel = webnovels_1[_i];
            novel.version = exports.premium.includes(novel.id) ? "premium" : "free";
        }
        // const _webnovelsToShow = webnovels
        //     .filter(item => filter_by_genre(item, genre))
        //     .filter(item => filter_by_version(item, version))
        //     .sort((a, b) => sortByFn(a, b, sortBy));
        // setWebnovelsToShow(_webnovelsToShow);
        // setColumns(getColumnLayout(_webnovelsToShow, 3, isMobile));
        // const divider = Math.ceil(_webnovelsToShow.length / 3)
        // const _mobileGrid = `grid-cols-${divider.toString()}`
        // setMobileGrid(_mobileGrid)
    }, [version, genre, sortBy, webnovels]);
    var text = sortBy === 'views' ? 'popularWebnovels' :
        sortBy === 'likes' ? 'likedWebnovels' :
            sortBy === 'date' ? 'latestWebnovels' : '';
    if (typeof genre === 'string') {
    }
    else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param");
    }
    else {
    }
    return (React.createElement("div", { className: 'relative w-full md:max-w-screen-lg mx-auto group' },
        React.createElement("h1", { className: "flex flex-row justify-between text-xl font-extrabold mb-3" },
            React.createElement("span", { className: 'text-black dark:text-white' }, phrases_1.phrase(dictionary, "toonyzHot", language))),
        React.createElement(react_slick_1["default"], __assign({}, settings, { className: "custom-slider" }), chunkedItems.map(function (chunk, chunkIndex) { return (React.createElement("div", { key: chunkIndex, className: "grid grid-cols-3 gap-4" }, chunk.map(function (item, index) { return (React.createElement("div", { key: chunkIndex + "-" + index, className: "bg-white dark:bg-black dark:text-white overflow-hidden border-gray-100 border-b dark:border-gray-700 flex flex-row items-center" },
            React.createElement(WebnovelComponent_1["default"], { webnovel: item, index: webnovelUtils_1.calculateIndex(index, chunkIndex, chunkedItems), ranking: true, chunkIndex: chunkIndex }))); }))); })),
        React.createElement("style", { jsx: true, global: true }, "\n                  .custom-slider {\n                     width: 100%;\n                     gap: 10px;\n                   }\n\n                 ")));
};
exports["default"] = WebnovelsList;
