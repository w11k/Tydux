import {Observable, Observer, Subscriber, Subscription} from "rxjs";
import {skip} from "rxjs/operators";
import {forEachIn, isPlainObject} from "./lodash/lodash";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {Fassade} from "./Fassade";
import {get, last} from "./utils";


export type ViewTreeState<T> = {
    [K in keyof T]
    : T[K] extends Fassade<infer S, any> ? S
        : T[K] extends object ? ViewTreeState<T[K]>
            : never;
};

export class View<T> {

    private readonly stores: [string[], Fassade<any, any>][] = [];

    private readonly stateChanges$: Observable<ViewTreeState<Readonly<T>>> =
        Observable.create((subscriber: Subscriber<ViewTreeState<Readonly<T>>>) => {
            let stateCell: [ViewTreeState<Readonly<T>>] = [{} as any];
            const subscriptions: Subscription[] = [];

            for (const [path, store] of this.stores) {
                this.mergeState(stateCell, path, store.state);
            }

            this.subscribeStores(stateCell, subscriber, this.stores, subscriptions);
            subscriber.next(stateCell[0]);

            return () => {
                subscriptions.forEach(s => s.unsubscribe());
            };
        });

    private _internalSubscriptionCount = 0;

    constructor(private readonly tree: T) {
        this.findStoresInTree(tree, [], this.stores);
    }

    /**
     * Internal API. Do not use!
     */
    get internalSubscriptionCount() {
        return this._internalSubscriptionCount;
    }

    private findStoresInTree(tree: any, path: string[], foundStores: [string[], Fassade<any, any>][]): void {
        forEachIn(tree, (child, key) => {
            const localPath = [...path];
            localPath.push(key);

            if (isPlainObject(child)) {
                this.findStoresInTree(child, localPath, foundStores);
            } else if (child instanceof Fassade) {
                foundStores.push([localPath, child]);
            }
        });
    }

    private subscribeStores(stateCell: [ViewTreeState<Readonly<T>>],
                            observer: Observer<ViewTreeState<Readonly<T>>>,
                            foundStores: [string[], Fassade<any, any>][],
                            subscriptions: Subscription[]) {

        for (const [path, child] of foundStores) {
            this._internalSubscriptionCount++;
            const sub = child
                .select()
                .unbounded()
                .pipe(
                    // skip the first state value because the initial view state
                    // gets created manually
                    skip(1),
                )
                .subscribe(state => {
                    this.mergeState(stateCell, path, state);
                    observer.next(stateCell[0]);
                })
                .add(() => {
                    this._internalSubscriptionCount--;
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
        const currentParentState = get(stateCell[0], parentPath);

        Object.assign(newParentState, currentParentState);
        newParentState[last(path)!] = stateChange;
        Object.freeze(newParentState);

        return this.mergeState(stateCell, parentPath, newParentState);
    }

    select(): ObservableSelection<ViewTreeState<Readonly<T>>>;

    select<R>(selector: (state: ViewTreeState<Readonly<T>>) => R): ObservableSelection<R>;

    select<R>(selector?: (state: ViewTreeState<Readonly<T>>) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.stateChanges$, selector);
    }

    selectNonNil<R>(selector: (state: ViewTreeState<Readonly<T>>) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.stateChanges$, selector);
    }

}
