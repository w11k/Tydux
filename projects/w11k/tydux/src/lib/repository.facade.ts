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

    add(id: string, entity: E) {
        this.prepare();
        this.state.list = [...this.state.list!, entity];
        this.state.byId = {
            ...this.state.byId!,
            [id]: entity,
        };
    }


}

export class RepositoryFacade<E> extends Facade<EntityStoreState<E>, EntityStoreCommands<E>> {

    constructor(mountPoint: NamedMountPoint<EntityStoreState<E>>,
                private readonly idSelector: ((entity: E) => string | number) | keyof E) {
        super(mountPoint, new EntityStoreState(), new EntityStoreCommands());
    }

    private getId(entity: E): string {
        if (typeof this.idSelector === "function") {
            return this.idSelector(entity).toString();
        } else {
            return (entity[this.idSelector] as any).toString();
        }
    }

    isPristine() {
        return this.state.list === null;
    }

    reset() {
        this.commands.reset();
    }

    add(entity: E) {
        this.commands.add(this.getId(entity), entity);
    }


}

