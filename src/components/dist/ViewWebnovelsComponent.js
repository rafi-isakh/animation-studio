"use client";
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
var navigation_1 = require("next/navigation");
var AuthorAndWebnovelsAsideComponent_1 = require("@/components/AuthorAndWebnovelsAsideComponent");
var UserContext_1 = require("@/contexts/UserContext");
require("@/styles/globals.css");
var LanguageContext_1 = require("@/contexts/LanguageContext");
var phrases_1 = require("@/utils/phrases");
var material_1 = require("@mui/material");
var cryptography_1 = require("@/utils/cryptography");
var image_1 = require("next/image");
var link_1 = require("next/link");
var ContentChapterListComponent_1 = require("./UI/ContentChapterListComponent");
var ViewWebnovelsComponent = function (_a) {
    var searchParams = _a.searchParams, webnovel = _a.webnovel, userWebnovels = _a.userWebnovels;
    var _b = react_1.useState(true), webnovelLoading = _b[0], setWebnovelLoading = _b[1];
    var _c = react_1.useState(true), userWebnovelsLoading = _c[0], setUserWebnovelsLoading = _c[1];
    var _d = react_1.useState([]), webnovels = _d[0], setWebnovels = _d[1];
    var _e = react_1.useState(false), atLeastOneWebnovel = _e[0], setAtLeastOneWebnovel = _e[1];
    var id = searchParams.id;
    var _f = react_1.useState(0), refreshKey = _f[0], setRefreshKey = _f[1];
    var _g = LanguageContext_1.useLanguage(), language = _g.language, dictionary = _g.dictionary;
    var nickname = webnovel === null || webnovel === void 0 ? void 0 : webnovel.user.nickname;
    var author_email = webnovel === null || webnovel === void 0 ? void 0 : webnovel.user.email_hash;
    var email = UserContext_1.useUser().email;
    var _h = react_1.useState(), deletedWebnovelId = _h[0], setDeletedWebnovelId = _h[1];
    var _j = react_1.useState(false), showDeleteModal = _j[0], setShowDeleteModal = _j[1];
    var isMediumScreen = material_1.useMediaQuery('(min-width:768px)');
    var _k = react_1.useState('1'), tabValue = _k[0], setTabValue = _k[1];
    var _l = react_1.useState(null), content = _l[0], setContent = _l[1];
    var handleContentUpdate = function (updatedContent) {
        setContent(updatedContent);
    };
    // const [chapterId, setChapterId] = useState(0);
    var pathname = navigation_1.usePathname();
    react_1.useEffect(function () {
        window.scrollTo(0, 0);
    }, [pathname]);
    if (typeof id === 'string') {
    }
    else if (Array.isArray(id)) {
        throw new Error("there should be only one id param");
    }
    else {
    }
    var router = navigation_1.useRouter();
    react_1.useEffect(function () {
        var hasWebnovels = false;
        if (webnovel) {
            hasWebnovels = true;
            setWebnovelLoading(false);
        }
        if (userWebnovels && userWebnovels.length > 0) {
            hasWebnovels = true;
            setWebnovels(userWebnovels);
            setUserWebnovelsLoading(false);
        }
        setAtLeastOneWebnovel(hasWebnovels);
    }, [webnovel, userWebnovels, deletedWebnovelId]);
    var isAuthor = function () {
        // if (!email || !author_email) return false;
        var userEmailHash = cryptography_1.createEmailHash(email);
        var authorEmailHash = author_email;
        return userEmailHash === authorEmailHash;
    };
    var handleNewChapter = function () {
        router.push("/new_chapter?id=" + id + "&novelLanguage=" + (webnovel === null || webnovel === void 0 ? void 0 : webnovel.language));
    };
    var handleDelete = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, webnovels_after_deletion, ids, first, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/delete_webnovel?id=" + id)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        console.error("Delete webnovel failed");
                        return [2 /*return*/];
                    }
                    webnovels_after_deletion = webnovels.filter(function (w) { return w.id.toString() != id; });
                    setWebnovels(webnovels_after_deletion);
                    setDeletedWebnovelId(id);
                    setShowDeleteModal(false);
                    if (!(webnovels_after_deletion.length > 0)) return [3 /*break*/, 3];
                    ids = webnovels_after_deletion.map(function (w) { return w.id; });
                    first = Math.min.apply(Math, ids);
                    return [4 /*yield*/, router.push("/view_webnovels?id=" + first.toString())];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, router.push('/view_webnovels')];
                case 4:
                    _a.sent();
                    router.refresh();
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("Couldn't delete webnovel " + id, error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleAIEditor = function () {
        router.push("/ai_editor?id=" + id);
    };
    var handleChange = function (event, newValue) {
        setTabValue(newValue);
    };
    var getWebnovel = function () {
        return webnovels.find(function (w) { return w.id.toString() == id; });
    };
    var theWebnovel = getWebnovel();
    if (id === undefined) {
        return (React.createElement("div", { className: 'md:max-w-screen-lg w-full flex flex-row justify-center mx-auto h-screen md:mt-[-96px] mt-[-80px]' },
            React.createElement("div", { className: "flex flex-col justify-center items-center space-y-2" },
                React.createElement(image_1["default"], { src: "/stelli/stelli_4.svg", alt: "noWebnovelsFound", width: 150, height: 100 }),
                React.createElement("p", { className: "text-md font-bold" },
                    " ",
                    phrases_1.phrase(dictionary, "noWebnovelsFound", language),
                    " "),
                React.createElement("p", { className: "text-md" },
                    " ",
                    phrases_1.phrase(dictionary, "noWebnovelsFound_subtitle", language),
                    " "),
                React.createElement(material_1.Button, { className: "bg-[#DB2777] text-md text-white px-4 py-2 rounded-md" },
                    React.createElement(link_1["default"], { href: "/new_webnovel" }, phrases_1.phrase(dictionary, "writeYourStory", language))))));
    }
    else {
        if (webnovelLoading || userWebnovelsLoading) {
            return (React.createElement("div", { className: 'w-full min-h-screen md:max-w-screen-lg mx-auto flex flex-row justify-center items-center' },
                React.createElement(material_1.CircularProgress, null)));
        }
        else if (atLeastOneWebnovel) {
            return (
            // <ThemeProvider theme={grayTheme}>
            React.createElement("div", { className: 'md:max-w-screen-lg mx-auto w-full min-h-screen' },
                React.createElement("div", { className: "flex md:flex-row flex-col justify-between items-start" },
                    React.createElement("div", { className: "md:w-1/3 w-full flex-grow-0" },
                        React.createElement(AuthorAndWebnovelsAsideComponent_1["default"], { webnovels: [theWebnovel], nickname: nickname, coverArt: (theWebnovel === null || theWebnovel === void 0 ? void 0 : theWebnovel.cover_art) || "", onNewChapter: handleNewChapter, onDelete: handleDelete })),
                    React.createElement("div", { className: 'flex-1 md:w-2/3 w-full' },
                        React.createElement(ContentChapterListComponent_1["default"], { content: theWebnovel, coverArt: (theWebnovel === null || theWebnovel === void 0 ? void 0 : theWebnovel.cover_art) || "", isWebtoon: false, relatedContent: webnovels, onContentUpdate: handleContentUpdate }))))
            // </ThemeProvider >
            );
        }
        else {
            return (React.createElement("div", { className: 'md:max-w-screen-md w-full flex flex-row justify-center mx-auto h-[80vh]' }, phrases_1.phrase(dictionary, "noWebnovelsFound", language)));
        }
    }
};
exports["default"] = ViewWebnovelsComponent;
