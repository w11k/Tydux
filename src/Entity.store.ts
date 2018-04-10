import * as _ from "lodash";
import {OperatorFunction} from "rxjs/interfaces";
import {EntityStoreObserver} from "./EntityStoreObserver";
import {Mutators} from "./mutators";
import {MutatorEvent, Store} from "./Store";
import {noopOperator} from "./StoreObserver";


export interface EntityMap<T> {
    [id: string]: T;
}

export interface EntityState<T> {
    ids: string[];
    entities: EntityMap<T>;
}

export class EntityMutators<T> extends Mutators<EntityState<T>> {

    clear() {
        this.state.ids = [];
        this.state.entities = {};
    }

    load(objs: { [id: string]: T }) {
        this.state.entities = objs;
        this.state.ids = _.keys(objs);
    }

    add(id: string, obj: T) {
        this.state.ids = [...this.state.ids, id];
        const entities = {
            ...this.state.entities
        };
        entities[id] = obj;

        this.state.entities = entities;

    }

    update(id: string, obj: T) {
        this.state.entities = {
            ...this.state.entities,
            id: obj
        };
    }

    remove(id: string): boolean {
        const idx = this.state.ids.indexOf(id);
        if (idx === -1) {
            return false;
        }

        const before = this.state.ids.slice(0, idx);
        const after = this.state.ids.slice(idx + 1);
        this.state.ids = [...before, ...after];

        const entities = _.clone(this.state.entities);
        delete entities[id];
        this.state.entities = entities;

        return true;
    }

}

export type Constructor<T> = {
    new(...args: any[]): T;
};

export class EntityStore<T, I extends keyof T> extends Store<EntityMutators<T>, EntityState<T>> {

    constructor(storeId: string, readonly constructor: Constructor<T>, readonly entityIdField: I) {
        super(storeId, new EntityMutators(), {
            ids: [],
            entities: {}
        });
    }

    clear(): void {
        this.mutate.clear();
    }

    load(objs: { [id: string]: T }): void {
        this.mutate.load(objs);
    }

    add(obj: T | T[]): void {
        if (!(obj instanceof Array)) {
            return this.add([obj]);
        }

        obj.forEach((o: T) => {
            const key = o[this.entityIdField].toString();
            this.mutate.add(key, o);
        });
    }

    update(obj: T | T[]): void {
        if (!(obj instanceof Array)) {
            return this.update([obj]);
        }

        obj.forEach((o: T) => {
            const key = o[this.entityIdField];
            this.mutate.update(key.toString(), o);
        });
    }

    remove(obj: T | T[]): void {
        if (!(obj instanceof Array)) {
            return this.remove([obj]);
        }

        obj.forEach((o: T) => {
            const key = o[this.entityIdField];
            this.mutate.remove(key.toString());
        });
    }


    bounded(operator: OperatorFunction<MutatorEvent<EntityState<T>>, MutatorEvent<EntityState<T>>>) {
        return new EntityStoreObserver(this.mutatorEvents$, operator);
    }

    unbounded() {
        return new EntityStoreObserver(this.mutatorEvents$, noopOperator);
    }
}
