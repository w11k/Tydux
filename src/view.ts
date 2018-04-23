import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {zip} from "rxjs/observable/zip";
import {Observer} from "rxjs/Observer";
import {Operator} from "rxjs/Operator";
import {shareReplay} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
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

    private readonly stores: [string[], Store<any, any>][] = [];

    private readonly stateChanges$ = Observable.create((observer: Observer<ViewTreeState<Readonly<T>>>) => {
        let stateCell: [ViewTreeState<Readonly<T>>] = [{} as any];
        const subscriptions: Subscription[] = [];

        // we need to buffer all inner Store mutator events while building the tree
        const buffer = new ReplaySubject<ViewTreeState<Readonly<T>>>(1);
        this.subscribeStores(stateCell, buffer, this.stores, subscriptions);

        // wait for all stores
        let allMutatorEvents = zip(...this.stores.map(([, store]) => store.mutatorEvents$));
        let bufferSub: Subscription;
        allMutatorEvents.subscribe(() => {
            let allHasUndispatched = this.stores.map(([, store]) => store.hasUndispatchedMutatorEvents());
            if (!_.every(allHasUndispatched)) {
                bufferSub = buffer.subscribe(observer);
            }
        });

        return () => {
            bufferSub.unsubscribe();
            subscriptions.forEach(s => s.unsubscribe());
        };
    }).pipe(
        shareReplay(1)
    );

    constructor(private readonly tree: T) {
        this.findStoresInTree(tree, [], this.stores);
    }

    private findStoresInTree(tree: any, path: string[], foundStores: [string[], Store<any, any>][]): void {
        _.forIn(tree, (child, key) => {
            const localPath = _.cloneDeep(path);
            localPath.push(key);

            if (_.isPlainObject(child)) {
                this.findStoresInTree(child, localPath, foundStores);
            } else if (child instanceof Store) {
                foundStores.push([localPath, child]);
            }
        });
    }

    private subscribeStores(stateCell: [ViewTreeState<Readonly<T>>],
                            observer: Observer<ViewTreeState<Readonly<T>>>,
                            foundStores: [string[], Store<any, any>][],
                            subscriptions: Subscription[]) {

        for (const [path, child] of foundStores) {
            const sub = child.unbounded().select()
                .subscribe(state => {
                    this.mergeState(stateCell, path, state);
                    observer.next(stateCell[0]);
                });
            subscriptions.push(sub);
        }
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
