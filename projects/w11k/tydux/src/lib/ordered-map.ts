/**
 * @alpha !
 */
export class OrderedMapState<E> {

    constructor(readonly idField: keyof E) {
    }

    /**
     * list of entities
     */
    list: E[] | null = null;

    /**
     * ID -> [index in list, entity]
     */
    byId: { [id: string]: [number, E] } | null = null;

}

export function orderedMapGetIdForEntity<E>(om: OrderedMapState<E>, entity: E) {
    return entity[om.idField].toString();
}

export function orderedMapIsPristine<E>(om: OrderedMapState<E>): boolean {
    return om.list === null;
}

export function orderedMapReset<E>(om: OrderedMapState<E>): OrderedMapState<E> {
    return {
        ...om,
        list: null,
        byId: null,
    };
}

export function orderedMapPrepare<E>(om: OrderedMapState<E>): OrderedMapState<E> {
    return orderedMapIsPristine(om)
        ? {
            ...orderedMapReset(om),
            list: [],
            byId: {}
        }
        : {...om};
}

export function orderedMapSetList<E>(om: OrderedMapState<E>, entities: E[]): OrderedMapState<E> {
    om = orderedMapPrepare(om);
    om.list = entities;
    om.byId = {};
    entities.forEach((entity, idx) => {
        const id = orderedMapGetIdForEntity(om, entity);
        om.byId![id] = [idx, entity];
    });
    return om;
}

// export function orderedMapAppendList<E>(om: OrderedMapState<E>, entities: E[]): OrderedMapState<E> {
//     om = orderedMapPrepare(om);
//     om.list = [
//         ...om.list!,
//         ...entities
//     ];
//     entities.forEach(entity => {
//         const id = orderedMapGetIdForEntity(om, entity);
//         om.byId![id] = entity;
//     });
//     return om;
// }

export function orderedMapAdd<E>(om: OrderedMapState<E>, entity: E): OrderedMapState<E> {
    om = orderedMapPrepare(om);
    om.list = [...om.list!, entity];
    om.byId = {
        ...om.byId,
        [orderedMapGetIdForEntity(om, entity)]: [
            om.list.length - 1,
            entity
        ]
    };
    return om;
}

export function orderedMapGetById<O extends OrderedMapState<E>, E>(om: O, id: any): E | undefined {
    if (om.byId === null) {
        return undefined;
    }
    return om.byId[orderedMapGetIdForEntity(om, id.toString())][1];
}
