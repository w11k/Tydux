import * as _ from "lodash";
import {Operator} from "rxjs/Operator";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {StateObserver} from "./StateObserver";
import {StateObserverProvider} from "./StateObserverProvider";
import {Store} from "./Store";

export type ViewTreeState<T> = {
    [K in keyof T]
    : T[K] extends Store<any, infer S> ? S
        : T[K] extends object ? ViewTreeState<T[K]>
        : never;
};

export class View<T> implements StateObserverProvider<ViewTreeState<Readonly<T>>> {

    state: ViewTreeState<Readonly<T>> = {} as any;

    private readonly stateChanges$ = new ReplaySubject<ViewTreeState<Readonly<T>>>(1);

    constructor(tree: T) {
        this.parseTree([], tree);
    }

    private parseTree(path: string[], tree: any) {
        _.forIn(tree, (child, key) => {
            const localPath = _.cloneDeep(path);
            localPath.push(key);

            if (_.isPlainObject(child)) {
                this.parseTree(localPath, child);
            } else if (child instanceof Store) {
                child.unbounded().select()
                    .subscribe(state => {
                        this.mergeState(localPath, state);
                        this.stateChanges$.next(this.state);
                    });
            }
        });
    }

    private mergeState(path: string[], stateChange: any): void {
        if (path.length === 0) {
            this.state = stateChange;
            return;
        }

        const newParentState: any = {};
        let parentPath = path.slice(0, path.length - 1);
        let currentParentState = parentPath.length > 0 ? _.get(this.state, parentPath) : this.state;
        Object.assign(newParentState, currentParentState);
        newParentState[_.last(path)!] = stateChange;
        Object.freeze(newParentState);

        return this.mergeState(parentPath, newParentState);
    }

    bounded(operator: Operator<ViewTreeState<Readonly<T>>, ViewTreeState<Readonly<T>>>): StateObserver<ViewTreeState<Readonly<T>>> {
        return new StateObserver(this.stateChanges$, operator);
    }

    unbounded(): StateObserver<ViewTreeState<Readonly<T>>> {
        return new StateObserver(this.stateChanges$);
    }

}
