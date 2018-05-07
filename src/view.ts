import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {skip} from "rxjs/operators";
import {Subscriber} from "rxjs/Subscriber";
import {Subscription} from "rxjs/Subscription";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {Store} from "./Store";


export class View<T> {

    private readonly stores: [string[], Store<any, any>][] = [];

    private readonly stateChanges$: Observable<any> =
        Observable.create((subscriber: Subscriber<any>) => {
            let stateCell: [any] = [{} as any];
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

    private subscribeStores(stateCell: [any],
                            observer: Observer<any>,
                            foundStores: [string[], Store<any, any>][],
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

    private mergeState(stateCell: [any], path: string[], stateChange: any): void {
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

    select(): ObservableSelection<any>;

    select<R>(selector: (state: any) => R): ObservableSelection<R>;

    select<R>(selector?: (state: any) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.stateChanges$, selector);
    }

    selectNonNil<R>(selector: (state: any) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.stateChanges$, selector);
    }

}
