import {Commands} from "./commands";
import {Facade} from "./Facade";
import {NamedMountPoint} from "./store";

export class EntityStoreState<E> {

    list: E[] | null;
    byId: { [id: string]: E } | null;

    constructor() {
        this.list = null;
        this.byId = null;
    }

}

class EntityStoreCommands<E> extends Commands<EntityStoreState<E>> {

    reset() {
        this.state = new EntityStoreState();
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

export class RepositoryFacade<E> extends Facade<EntityStoreState<E>, EntityStoreCommands<E>> {

    private readonly getId: (entity: E) => string;

    constructor(mountPoint: NamedMountPoint<EntityStoreState<E>>,
                idSelector: ((entity: E) => string | number) | keyof E) {
        super(mountPoint, new EntityStoreState(), new EntityStoreCommands());

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
        this.commands.prepare();
        this.commands.addSingleToList(entity);
        this.commands.addSingleToMap(this.getId(entity), entity);
    }

    addList(entities: E[]) {
        this.commands.prepare();
        this.commands.addMultipleToList(entities);
        entities.forEach(e => this.commands.addSingleToMap(this.getId(e), e));
    }

}

