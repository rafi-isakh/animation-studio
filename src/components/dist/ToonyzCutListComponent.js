'use client';
"use strict";
exports.__esModule = true;
exports.ToonyzCutListComponent = void 0;
var react_1 = require("react");
var material_1 = require("@mui/material");
var material_2 = require("@mui/material");
var lucide_react_1 = require("lucide-react");
var ToonyzCutCard_1 = require("@/components/ToonyzCutCard");
var link_1 = require("next/link");
var phrases_1 = require("@/utils/phrases");
var LanguageContext_1 = require("@/contexts/LanguageContext");
exports.ToonyzCutListComponent = function (_a) {
    var webnovels = _a.webnovels;
    var _b = react_1.useState('1'), tabValue = _b[0], setTabValue = _b[1];
    var _c = LanguageContext_1.useLanguage(), dictionary = _c.dictionary, language = _c.language;
    var handleChange = function (event, newValue) {
        setTabValue(newValue);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: 'flex flex-col items-center gap-4 mt-4' },
            React.createElement(material_1.Box, { sx: {
                    borderBottom: 1,
                    borderColor: 'divider',
                    width: '100%'
                }, className: 'dark:text-gray-700' },
                React.createElement("div", { className: "flex flex-row justify-end items-center mb-4 md:pr-0 pr-2" },
                    React.createElement(link_1["default"], { href: "/toonyzcut/submit" },
                        React.createElement(material_2.Button, { sx: {
                                backgroundColor: 'transparent',
                                border: '2px solid #eee',
                                borderRadius: '15px',
                                color: '#DB2777',
                                '&:hover': {
                                    backgroundColor: '#db2777',
                                    color: '#fff'
                                }
                            }, className: 'bg-transparent border-2\n                                           rounded-md flex flex-row items-center justify-center\n                                           gap-2 text-sm w-full mt-2 py-2' },
                            React.createElement("div", { className: 'flex flex-row items-center justify-center gap-2' },
                                React.createElement(lucide_react_1.Share, { size: 16 }),
                                phrases_1.phrase(dictionary, 'toonyzcut_offer_proposal', language)))))),
            React.createElement("div", { className: 'md:max-w-screen-lg w-full' },
                React.createElement("div", { className: 'grid md:grid-cols-4 grid-cols-2 \n                                  gap-y-12 md:gap-y-12  /* Vertical gaps */\n                                  gap-x-4 md:gap-x-8  /* Horizontal gaps */\n                                  p-2 overflow-hidden' }, webnovels
                    .map(function (webnovel, index) { return (React.createElement(ToonyzCutCard_1["default"], { key: index, webnovel: webnovel })); }))))));
};
