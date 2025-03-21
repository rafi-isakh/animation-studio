import { Webnovel, SortBy, Chapter, Comment, ToonyzPost } from '@/components/Types';
import moment from 'moment';


export const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 117, 115, 116, 121, 130, 103];

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
    if (!version) return (item.premium ? "premium" : "free");
    else if (version === "free") return !item.premium;
    else return version === (item.premium ? "premium" : "free");
};

export const sortByFn = (a: Webnovel, b: Webnovel, sortBy: SortBy): number => {
    if (sortBy === 'recommendation') {
        return Math.random() - 0.5;
    } else if (sortBy === 'views') {
        return b.views - a.views;
    } else if (sortBy === 'likes') {
        return b.upvotes - a.upvotes;
    } else if (sortBy === 'date') {
        let latestDateA = new Date(0);
        let latestDateB = new Date(0);

        for (let i = 0; i < a.chapters_length; i++) {
            let dateA = moment(a.last_update).toDate();
            if (dateA > latestDateA) latestDateA = dateA;
        }
        for (let i = 0; i < b.chapters_length; i++) {
            let dateB = moment(b.last_update).toDate();
            if (dateB > latestDateB) latestDateB = dateB;
        }
        return latestDateB.getTime() - latestDateA.getTime();
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

