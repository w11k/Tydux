export function groupByUniqueId<T>(list: T[], keyFn: (entry: T) => any): { [key: string]: T } {
    const byId: { [key: string]: T } = {};
    for (const e of list) {
        const key = keyFn(e);
        if (byId.hasOwnProperty(key)) {
            throw new Error("duplicate key: " + key);
        }
        byId[key] = e;

    }
    return byId;
}

export function groupById<T>(list: T[], keyFn: (entry: T) => any): { [key: string]: T[] } {
    const byId: { [key: string]: T[] } = {};
    for (const e of list) {
        const key = keyFn(e);
        if (!byId.hasOwnProperty(key)) {
            byId[key] = [];
        }
        byId[key].push(e);

    }
    return byId;
}
