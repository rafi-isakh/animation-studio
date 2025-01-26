'use client';
"use strict";
exports.__esModule = true;
var image_1 = require("next/image");
var material_1 = require("@mui/material");
var urls_1 = require("@/utils/urls");
var phrases_1 = require("@/utils/phrases");
var react_1 = require("react");
var link_1 = require("next/link");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var ToonyzCutSubmitModal_1 = require("@/components/ToonyzCutSubmitModal");
var ToonyzCutViewerModal_1 = require("@/components/ToonyzCutViewerModal");
var OtherTranslateComponent_1 = require("@/components/OtherTranslateComponent");
var material_2 = require("@mui/material");
var lucide_react_1 = require("lucide-react");
var ToonyzCutCard = function (_a) {
    var webnovel = _a.webnovel;
    var imageSrc = urls_1.getImageUrl(webnovel === null || webnovel === void 0 ? void 0 : webnovel.cover_art);
    var _b = react_1.useState(false), openModal = _b[0], setOpenModal = _b[1];
    var _c = react_1.useState(false), openSubmitModal = _c[0], setOpenSubmitModal = _c[1];
    var _d = LanguageContext_1.useLanguage(), dictionary = _d.dictionary, language = _d.language;
    var isMobile = material_2.useMediaQuery('(max-width: 768px)');
    var handleOpenModal = function (event) {
        event.preventDefault();
        setOpenModal(true);
    };
    var handleCloseModal = function () {
        setOpenModal(false);
    };
    var handleOpenSubmitModal = function () {
        setOpenSubmitModal(true);
    };
    var handleCloseSubmitModal = function () {
        setOpenSubmitModal(false);
    };
    return (React.createElement("div", { key: webnovel.id, className: 'relative flex flex-col justify-center items-center gap-2 w-full md:max-w-[200px] bg-gray-100 rounded-xl' },
        React.createElement("div", { className: 'relative group w-full max-h-[200px]' },
            React.createElement(link_1["default"], { href: '#', onClick: function (event) { return handleOpenModal(event); } },
                React.createElement(image_1["default"], { src: imageSrc, alt: webnovel.title, width: isMobile ? 100 : 200, height: isMobile ? 150 : 250, className: 'object-cover w-full h-full rounded-t-xl group-hover:opacity-50 transition-opacity duration-300' }),
                React.createElement("div", { className: "absolute top-0 left-0 w-full h-full bg-black text-white dark:text-white opacity-0 group-hover:opacity-50 transition-opacity duration-300 flex flex-row gap-1 items-center justify-center rounded-t-xl" },
                    React.createElement(lucide_react_1.Eye, { size: 16, className: "text-white" }),
                    " View"))),
        React.createElement("div", { className: 'flex flex-col items-center gap-1 w-full' },
            React.createElement("div", { className: 'font-semibold truncate w-full text-center text-base' },
                React.createElement(OtherTranslateComponent_1["default"], { content: webnovel.title, elementId: webnovel.id.toString(), elementType: 'webnovel', elementSubtype: 'title' })),
            React.createElement("p", { className: 'text-gray-600 truncate w-full text-center text-sm' }, webnovel.user.nickname),
            React.createElement("p", { className: 'text-gray-500 truncate w-full text-center text-sm' }, phrases_1.phrase(dictionary, webnovel.genre, language))),
        React.createElement(material_1.Button, { onClick: handleOpenSubmitModal, sx: {
                backgroundColor: 'transparent',
                border: '2px solid #4b5563',
                color: '#4b5563',
                width: '100%',
                '&:hover': {
                    backgroundColor: '#db2777',
                    color: '#fff'
                }
            }, className: 'bg-transparent border-1 text-gray-600\n                           dark:text-gray-600 w-full\n                           rounded-md flex flex-row items-center justify-center\n                           gap-2 text-sm' }, phrases_1.phrase(dictionary, 'submit_proposal', language)),
        React.createElement(ToonyzCutSubmitModal_1["default"], { webnovel: webnovel, open: openSubmitModal, onClose: handleCloseSubmitModal }),
        React.createElement(ToonyzCutViewerModal_1["default"], { webnovel: webnovel, open: openModal, onClose: handleCloseModal })));
};
exports["default"] = ToonyzCutCard;
