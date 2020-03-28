import {Commands} from "./commands";
import {Facade} from "./Facade";
import {NamedMountPoint} from "./store";

/**
 * @alpha !
 */
export class OrderedMapState<E> {

    list: E[] | null;
    byId: { [id: string]: E } | null;

    constructor() {
        this.list = null;
        this.byId = null;
    }

}

/**
 * @alpha !
 */
class OrderedMapCommands<E> extends Commands<OrderedMapState<E>> {

    reset() {
        this.state = new OrderedMapState();
    }

    prepare() {
        if (this.state.list === null) {
            this.state.list = [];
            this.state.byId = {};
        }
    }

    addSingleToList(entity: E) {
        this.state.list = [...this.state.list!, entity];
    }

    addSingleToMap(id: string, entity: E) {
        this.state.byId = {
            ...this.state.byId!,
            [id]: entity,
        };
    }

    addMultipleToList(list: E[]) {
        this.state.list = [...this.state.list!, ...list];
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
        this.commands.reset();
        this.commands.prepare();
        this.addList(entities);
    }

    add(entity: E) {
        this.prepare();
        this.commands.addSingleToList(entity);
        this.commands.addSingleToMap(this.getId(entity), entity);
    }

    addList(entities: E[]) {
        this.prepare();
        this.commands.addMultipleToList(entities);
        entities.forEach(e => this.commands.addSingleToMap(this.getId(e), e));
    }

    private prepare() {
        if (this.isPristine()) {
            this.commands.prepare();
        }
    }

}

