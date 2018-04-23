import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Operator} from "rxjs/Operator";
import {shareReplay} from "rxjs/operators";
import {Subscription} from "rxjs/Subscription";
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

    private readonly stateChanges$ = Observable.create((observer: Observer<ViewTreeState<Readonly<T>>>) => {
        const subscriptions: Subscription[] = [];
        this.parseTree([{} as any], observer, [], this.tree, subscriptions);
        return () => {
            subscriptions.forEach(s => s.unsubscribe());
        };
    }).pipe(shareReplay(1));

    constructor(private readonly tree: T) {
    }

    private parseTree(stateCell: [ViewTreeState<Readonly<T>>], observer: Observer<ViewTreeState<Readonly<T>>>, path: string[], tree: any, subscriptions: Subscription[]) {
        _.forIn(tree, (child, key) => {
            const localPath = _.cloneDeep(path);
            localPath.push(key);

            if (_.isPlainObject(child)) {
                this.parseTree(stateCell, observer, localPath, child, subscriptions);
            } else if (child instanceof Store) {
                const sub = child.unbounded().select()
                    .subscribe(state => {
                        this.mergeState(stateCell, localPath, state);
                        observer.next(stateCell[0]);
                    });
                subscriptions.push(sub);
            }
        });
    }

    private mergeState(stateCell: [ViewTreeState<Readonly<T>>], path: string[], stateChange: any): void {
        if (path.length === 0) {
            stateCell[0] = stateChange;
            return;
        }

        const newParentState: any = {};
        let parentPath = path.slice(0, path.length - 1);
        let currentParentState = parentPath.length > 0 ? _.get(stateCell[0], parentPath) : stateCell[0];
        Object.assign(newParentState, currentParentState);
        newParentState[_.last(path)!] = stateChange;
        Object.freeze(newParentState);

        return this.mergeState(stateCell, parentPath, newParentState);
    }

    bounded(operator: Operator<ViewTreeState<Readonly<T>>, ViewTreeState<Readonly<T>>>): StateObserver<ViewTreeState<Readonly<T>>> {
        return new StateObserver(this.stateChanges$, operator);
    }

    unbounded(): StateObserver<ViewTreeState<Readonly<T>>> {
        return new StateObserver(this.stateChanges$);
    }

}
