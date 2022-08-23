import { type Event, type Filter } from './schema';

export const nonEmptyIntersect = <T>(lhs: T[]|undefined, rhs: T[]) =>
    () => {
        const sset = new Set(lhs);
        return sset.size === 0 ||
            rhs.filter((o: T) => sset.has(o)).length > 0;
    };

export const hasElement = <T>(arr: T[]|undefined, obj: T) =>
    () => !arr || arr.indexOf(obj) > -1;

export const getTags = (event: Event, tagName: string) =>
    (event.tags || [])
        .filter((tag: string[]) => tag[0] == tagName)
        .map((tag: string[]) => tag[1]);

export const matches = (event: Event, filter: Filter) => {
    const predicates = [
        hasElement(filter.ids, event.id),
        hasElement(filter.authors, event.pubkey),
        hasElement(filter.kinds, event.kind),
        nonEmptyIntersect(filter['#e'], getTags(event, '#e')),
        nonEmptyIntersect(filter['#p'], getTags(event, '#p')),
        () => !filter.since || filter.since <= event.created_at,
        () => !filter.until || filter.until >= event.created_at,
    ];

    return predicates.find((p) => !p()) === undefined;
}

export const matchesAll = (event: Event, filters: Filter[]) =>
    filters.find((filt) => !matches(event, filt)) !== undefined;
