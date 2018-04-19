import {Operator} from "rxjs/Operator";
import {StateObserver} from "./StateObserver";
import {StateObserverProvider} from "./StateObserverProvider";
import {Store} from "./Store";


export type ViewTreeState<T> = {
    [K in keyof T]
    : T[K] extends Store<any, infer S> ? S
        : T[K] extends object ? ViewTreeState<T[K]>
        : never;
};


export class View<T> implements StateObserverProvider<ViewTreeState<T>> {

    state!: ViewTreeState<T>;

    constructor(tree: T) {




    }

    bounded(operator: Operator<ViewTreeState<T>, ViewTreeState<T>>): StateObserver<ViewTreeState<T>> {
        return undefined as any;
    }

    unbounded(): StateObserver<ViewTreeState<T>> {
        return undefined as any;
    }

}


export function createView<T>(tree: T): View<T> {
    return new View(tree);
}

