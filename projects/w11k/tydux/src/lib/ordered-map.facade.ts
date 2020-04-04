import {Commands} from "./commands";
import {Facade} from "./Facade";
import {NamedMountPoint} from "./store";

/**
 * @alpha !
 */
export class OrderedMapState<E> {

    list: E[] | null = null;
    byId: { [id: string]: E } | null = null;

}

/**
 * @alpha !
 */
class OrderedMapCommands<E> extends Commands<OrderedMapState<E>> {

    reset() {
        this.state = new OrderedMapState();
    }

    private prepare() {
        if (this.state.list === null) {
            this.state.list = [];
            this.state.byId = {};
        }
    }

    setList(ids: string[], entities: E[]) {
        this.prepare();

        this.state.list = entities;
        this.state.byId = {};
        ids.forEach((value, idx) => {
            this.state.byId![value] = entities[idx];
        });
    }

    add(id: string, entity: E) {
        this.prepare();

        this.state.list = [
            ...this.state.list!,
            entity
        ];

        this.state.byId = {
            ...this.state.byId,
            [id]: entity,
        };
    }

    appendList(ids: string[], entities: E[]) {
        this.prepare();

        this.state.list = [...this.state.list!, ...entities];
        this.state.byId = {...this.state.byId};
        ids.forEach((value, idx) => {
            this.state.byId![value] = entities[idx];
        });
    }

}

/**
 * @alpha !
 */
export class OrderedMapFacade<E> extends Facade<OrderedMapState<E>, OrderedMapCommands<E>> {

    private readonly getId: (entity: E) => string;

    constructor(mountPoint: NamedMountPoint<OrderedMapState<E>>,
                idSelector: ((entity: E) => string | number) | keyof E) {
        super(mountPoint, new OrderedMapState(), new OrderedMapCommands());

        if (typeof idSelector === "function") {
            this.getId = e => idSelector(e).toString();
        } else {
            this.getId = e => (e[idSelector] as any).toString();
        }

    }

    isPristine() {
        return this.state.list === null;
    }

    reset() {
        this.commands.reset();
    }

    setList(entities: E[]) {
        const ids = this.getIdsForEntities(entities);
        this.commands.setList(ids, entities);
    }

    add(entity: E) {
        this.commands.add(this.getId(entity), entity);
    }

    appendList(entities: E[]) {
        const ids = this.getIdsForEntities(entities);
        this.commands.appendList(ids, entities);
    }

    private getIdsForEntities(entities: E[]) {
        return entities.map(e => this.getId(e));
    }
}

