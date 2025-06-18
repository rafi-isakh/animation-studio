import { Webnovel, SortBy} from '@/components/Types';

export const getNumberOfLikes = (novels: Webnovel[]) => {
    let likes = 0;
    for (let i = 0; i < novels.length; i++) {
        likes += novels[i].upvotes;
    }
    return likes;
}

export const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 117, 115, 116, 121, 130 ]
export const videoDisallowedForKorean = [134, 135, 136, 133, 139, 140, 141, 143, 144]
export const chapterPrice = (language: string) => {
    if (language === "ko") {
        return "10";
    } else if (language === "en") {
        return "30";
    } else if (language === "ja") {
        return "20";
    } 
}

export const filter_by_genre = (item: Webnovel, genre: string | null | undefined) => {
    if (genre === "all" || genre == null) return true;
    return genre === item.genre;
};

export const filter_by_version = (item: Webnovel, version: string | null | undefined) => {
    if (!version) return item.premium;
    else if (version === "community") return !item.premium;
    else return item.premium;
};

export const filter_by_adult_material = (item: Webnovel, is_adult_material: boolean | null | undefined) => {
    if (is_adult_material === null) return true;
    if (!is_adult_material) return !item.is_adult_material;
    else return item.is_adult_material;
};

const genre_recommendation_score = (a: Webnovel, b: Webnovel, genres: { [key: string]: boolean }): number => {
    const a_genre = a.genre;
    const b_genre = b.genre;
    const a_score = genres[a_genre] ? Math.random() : 0;
    const b_score = genres[b_genre] ? Math.random() : 0;
    const noise = Math.random() * 0.01 - 0.005; // add random noise for discovery
    const score = b_score - a_score + noise;
    return score;
}

export const sortByFn = (a: Webnovel, b: Webnovel, sortBy: SortBy, genres: { [key: string]: boolean } | null = null): number => {
    if (sortBy === 'recommendation' && genres) {
        return genre_recommendation_score(a, b, genres)
    } else if (sortBy === 'views') {
        // Calculate time difference in days
        const daysSinceCreation = (date: Date) => {
            const now = new Date();
            return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        };

        // Score = views * decay factor based on age
        // Using a soft decay that reduces score by ~50% after 1 month
        const getScore = (webnovel: Webnovel) => {
            const days = daysSinceCreation(new Date(webnovel.created_at));
            const decayFactor = 1 / (1 + days/30); // 30 days = 1 month
            return webnovel.views * decayFactor;
        };

        return getScore(b) - getScore(a);
    } else if (sortBy === 'likes') {
        return b.upvotes - a.upvotes;
    } else if (sortBy === 'date') {
        let dateA = new Date(a.created_at);
        let dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
    } else {
        return 0;
    }
};


export const calculateIndex = (rowIndex: number, colIndex: number, columns: Webnovel[][]) => {
    if (colIndex === 0) {
        return rowIndex + 1;
        } else {
            return rowIndex + colIndex * columns[colIndex - 1]?.length + 1;
        }
    }


export const getWebnovelsToShow = (webnovels: Webnovel[], sortBy: SortBy, genres: { [key: string]: boolean } | null = null, genre: string | null = null, version: string | null = null, is_adult_material: boolean | null = null) => {
    let _webnovelsToShow = webnovels
        .filter(item => filter_by_genre(item, genre))
        .filter(item => filter_by_adult_material(item, is_adult_material))
        .filter(item => filter_by_version(item, version))
        .filter(item => item.chapters_length > 0)
        .sort((a, b) => sortByFn(a, b, sortBy, genres));

    return _webnovelsToShow;
}

export const getColumnLayout = (webnovels: Webnovel[], numColumns: number, isMobile: boolean) => {
    const columns: Webnovel[][] = Array.from({ length: numColumns }, () => []);

    // For desktop, keep original column-wise distribution
        const divider = Math.ceil(webnovels.length / numColumns)
        webnovels.forEach((webnovel, index) => {
            columns[Math.floor(index / divider)].push(webnovel);
        });
        // 0 -> 0, 1-> 0, 2-> 0, 3-> 1, 4-> 1, 5-> 1, 6-> 2, 7-> 2, 8-> 2

        if (isMobile) {
            // For mobile, transpose columns to rows
            const transposedColumns: Webnovel[][] = Array.from({ length: numColumns }, () => []);
            columns.forEach((column, colIndex) => {
                column.forEach((webnovel, rowIndex) => {
                    if (!transposedColumns[rowIndex]) {
                        transposedColumns[rowIndex] = [];
                    }
                    transposedColumns[rowIndex][colIndex] = webnovel;
                });
            });

            // Filter out any undefined values and empty arrays
            const cleanTransposedColumns = transposedColumns
                .filter(column => column.length > 0)
                .map(column => column.filter(Boolean));

            return cleanTransposedColumns;
        } else {

            return columns;
        }
    }

    // AUTHOR ENGLISH NAME SHOULD BE IN DATABASE, BUT SINCE IT ISN'T AND IT'S GOING TO TAKE SOME TIME, HERE'S A TEMP FIX
export const koreanToEnglishAuthorName : { [key: string]: string } = {
    "독연":	"dok yeon",
    "온리온":	"OnlyOn",
    "다원나린":	"DawonNarin",
    "김호섭":	"hoseup",
    "언정이":	"eonjeong",
    "거북수염":	"Turtlebeard",
    "후두마루":	"Hudumaru",
    "홍삼더덕":	"Hongsamdeodeok",
    "차우렌즈":	"CHAWOOLENS",
    "이르스":	"Irusu",
    "성상영":	"Sangyoung Seong",
    "데카스펠":	"deca spell"
}

export const isPurchasedChapter = (purchased_webnovel_chapters: [number, string][], chapter_id: number, language: string) => {
    if (purchased_webnovel_chapters.length === 0) return false;
    return purchased_webnovel_chapters.some(([chapterId, lang]) => chapterId === chapter_id && lang === language);
}

export const getAuthorDisplayName = (content: { 
    premium: boolean; 
    author: { nickname: string }; 
    user: { nickname: string }; 
}, language: string): string => {
     // if not premium, that is, if it is a community webnovel, 
     // the user (who actually registered and logged in) is the one whose nickname is what we want to show.
     // if premium, we want to return the author's nickname. 
     // The author is created dynamically when a webnovel is added through add_webnovel_admin. 
     // If language is Korean, return it right away; if it's English, convert it with a dictionary.
    if (!content.premium) {
        return content.user.nickname;
    }
    
    if (language === 'ko') {
        return content.author.nickname;
    }
    
    return koreanToEnglishAuthorName[content.author.nickname] || content.author.nickname;
}