import {Action, Dispatch, Store as ReduxStore, Unsubscribe} from "redux";
import {Observable, Observer} from "rxjs";
import {mutatorHasInstanceMembers} from "./error-messages";
import {
    createActionForMutator,
    createReducerFromMutator,
    createTypeForInvocationFromStore,
    Mutator,
    MutatorAction,
    MutatorMethods,
    MutatorReducer
} from "./mutator";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {createProxy, functions, functionsIn} from "./utils";


// export class ProcessedAction<S> {
//     constructor(readonly storeId: string,
//                 readonly context: string | null | undefined,
//                 readonly mutatorAction: MutatorAction,
//                 readonly state: S,
//                 public duration?: number) {
//     }
// }

export function failIfInstanceMembersExistExceptState(obj: any) {
    const members = Object.keys(obj).filter(key => key !== "state");
    if (members.length > 0) {
        throw new Error(mutatorHasInstanceMembers + ": " + members.join(", "));
    }
}

// export class StoreConnector<S> {
//
//     private _state: S = undefined as any;
//
//     readonly stateChangesSubject = new ReplaySubject<S>(1);
//
//     constructor(readonly storeId: string) {
//     }
//
//     get state(): Readonly<S> {
//         return this._state;
//     }
//
//     setState(state: S) {
//         this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
//     }
//
// }

const tyduxStoreReducerList: MutatorReducer<any>[] = [];

export function tyduxReducer(state: any, action: any) {
    for (let reducer of tyduxStoreReducerList) {
        state = reducer(state, action);
    }
    return state;
}

const uniqueStoreIds: { [id: string]: number } = {};

function getUniqueStoreId(name: string) {
    if (uniqueStoreIds[name] === undefined) {
        uniqueStoreIds[name] = 1;
    } else {
        uniqueStoreIds[name] += 1;
    }

    const count = uniqueStoreIds[name];
    if (count === 1) {
        return name;
    } else {
        return `${name}(${count})`;
    }
}

export interface MountPoint<S, L> {
    dispatch: Dispatch<Action<string>>;
    getState: () => L;
    extractState: (globalState: S) => L;
    setState: (globalState: S, localState: L) => S;
    subscribe: (listener: () => void) => Unsubscribe;
}

export function createMountPoint<S, L>(store: ReduxStore<S, any>,
                                       stateGetter: (globalState: S) => L,
                                       stateSetter: (globalState: S, localState: L) => S): MountPoint<S, L> {
    return {
        dispatch: store.dispatch.bind(store),
        getState: () => stateGetter(store.getState()),
        extractState: (state: S) => stateGetter(state),
        setState: stateSetter,
        subscribe: store.subscribe.bind(store),
    };
}

export abstract class Store<S, M extends Mutator<S>> {

    readonly storeId: string;

    private destroyed = false;

    // private _undeliveredProcessedActionsCount = 0;

    private readonly mutatorContextCallstack: string[] = [];

    private readonly reduxStoreObservable: Observable<S> = Observable.create((observer: Observer<S>) => {
        return this.mountPoint.subscribe(() => {
            observer.next(this.mountPoint.getState());
        });
    });

    // private readonly processedActionsSubject = new ReplaySubject<ProcessedAction<S>>(1);
    // readonly processedActions$: Observable<ProcessedAction<S>> = this.processedActionsSubject;

    protected readonly mutate: MutatorMethods<M>;

    constructor(readonly mountPoint: MountPoint<any, S>) {
        const mutatorInstance = this.createMutator();
        failIfInstanceMembersExistExceptState(mutatorInstance);

        this.storeId = getUniqueStoreId(this.getName().replace(" ", "_"));

        this.enrichInstanceMethods();

        this.mutate = this.createMutatorProxy(mutatorInstance);
        tyduxStoreReducerList.push(this.createMutatorReducer(mutatorInstance));

        delete (this.mutate as any).state;
    }

    getName() {
        return "unnamed";
    }

    abstract createMutator(): M;

    get state(): Readonly<S> {
        return this.mountPoint.getState();
    }

    /**
     * Completes all observables returned by this store. Once this method gets called,
     * dispatched actions won't have an effect.
     */
    destroy(): void {
        this.destroyed = true;
        // this.storeConnector.stateChangesSubject.complete();
        // this.processedActionsSubject.complete();
    }

    /**
     * Delegate to Store#destroy() for Angular.
     */
    ngOnDestroy(): void {
        this.destroy();
    }

    // hasUndeliveredProcessedActions() {
    //     return this._undeliveredProcessedActionsCount !== 0;
    // }

    select(): ObservableSelection<Readonly<S>>;

    // select<R>(selector: (state: Readonly<S>) => R): ObservableSelection<R>;

    select<R>(selector?: (state: Readonly<S>) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.reduxStoreObservable, selector);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.reduxStoreObservable, selector);
    }

    private enrichInstanceMethods() {
        const methodNamesUntilStoreParent: string[] = [];
        let level: any = this;
        while (level instanceof Store) {
            methodNamesUntilStoreParent.push(...functions(level));
            level = Object.getPrototypeOf(level);
        }

        for (let fnMemberName of methodNamesUntilStoreParent) {
            this.enrichInstanceMethod(fnMemberName);
        }
    }

    private enrichInstanceMethod(name: string) {
        const self = this;
        let member = (this as any)[name];
        Object.getPrototypeOf(this)[name] = function () {
            self.mutatorContextCallstack.push(name);
            try {
                const result = member.apply(this, arguments);
                if (result instanceof Promise) {
                    return new Promise(resolve => {
                        self.mutatorContextCallstack.push(name);
                        resolve(result);
                    }).then(value => {
                        self.mutatorContextCallstack.pop();
                        return value;
                    });
                } else {
                    return result;
                }
            } finally {
                self.mutatorContextCallstack.pop();
            }
        };
    }

    private createMutatorProxy(mutatorInstance: any): any {
        const proxyObj = {} as any;
        for (let mutatorMethodName of functionsIn(mutatorInstance)) {
            const self = this;
            proxyObj[mutatorMethodName] = function () {
                const storeMethodName = self.mutatorContextCallstack[self.mutatorContextCallstack.length - 1];
                const actionType = createTypeForInvocationFromStore(self.storeId, storeMethodName, mutatorMethodName);
                const args = Array.prototype.slice.call(arguments);
                const mutatorAction: Action<string> = {type: actionType, payload: args} as any;
                self.mountPoint.dispatch(mutatorAction);
            };
        }

        return proxyObj;
    }

    private createMutatorReducer(mutatorInstance: any): MutatorReducer<S> {
        const mutatorReducer = createReducerFromMutator<S>(mutatorInstance);

        return (state: any, mutatorAction: MutatorAction) => {
            const preLocalState = createProxy(this.mountPoint.extractState(state));

            if (this.destroyed || !this.isActionForThisStore(mutatorAction)) {
                return state;
            }

            const mutatorMethodName = createActionForMutator(mutatorAction);
            if (mutatorMethodName !== null) {
                const postLocalState = mutatorReducer(preLocalState, mutatorMethodName);
                state = this.mountPoint.setState(state, postLocalState);
            }

            return state;
        };
    }

    private isActionForThisStore(mutatorAction: MutatorAction) {
        if (typeof mutatorAction.type !== "string") {
            return;
        }

        if (mutatorAction.type.indexOf(" / ") === -1) {
            return false;
        }
        let idx = mutatorAction.type.indexOf("#");
        if (idx === -1) {
            idx = mutatorAction.type.indexOf(" ");
        }
        if (idx === -1) {
            return false;
        }

        const forStoreId = mutatorAction.type.substr(0, idx);
        return forStoreId === this.storeId;
    }

}
