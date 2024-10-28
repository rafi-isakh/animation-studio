import { Webnovel, SortBy } from '@/components/Types';
import moment from 'moment';

export const filter_by_genre = (item: Webnovel, genre: string | null | undefined) => {
    if (genre === "all" || genre == null) return true;
    return genre === item.genre;
};

export const filter_by_version = (item: Webnovel, version: string | null | undefined) => {
    return version === item.version;
};

export const sortByFn = (a: Webnovel, b: Webnovel, sortBy: SortBy): number => {
    if (sortBy === 'views') {
        return b.views - a.views;
    } else if (sortBy === 'likes') {
        return b.upvotes - a.upvotes;
    } else if (sortBy === 'date') {
        let latestDateA = new Date(0);
        let latestDateB = new Date(0);

        for (let i = 0; i < a.chapters.length; i++) {
            let dateA = moment(a.chapters[i].created_at).toDate();
            if (dateA > latestDateA) latestDateA = dateA;
        }
        for (let i = 0; i < b.chapters.length; i++) {
            let dateB = moment(b.chapters[i].created_at).toDate();
            if (dateB > latestDateB) latestDateB = dateB;
        }
        return latestDateB.getTime() - latestDateA.getTime();
    } else {
        return 0;
    }
};
