import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {filter, map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {DeferredMutator} from "./DeferredMutator";
import {isLogMutatorDurationEnabled, isTyduxDevelopmentModeEnabled} from "./development";
import {Mutator, MutatorState} from "./mutators";
import {StoreObserver} from "./StoreObserver";
import {createActionFromArguments, createProxy} from "./utils";

export type MutatorStateOrUndefined<G> =
    G extends Mutator<infer S> ? Readonly<S | undefined> : never;

export type MountedDeferredMutatorState<D> =
    D extends MountedDeferredMutator<infer S> ? MutatorStateOrUndefined<S> : never;

export type MountedDeferredMutator<S> = {
    resolve(): Promise<S>;
    get(): Promise<S>;
};

export type DeferredMutatorToMountedDeferredMutator<D> =
    D extends DeferredMutator<infer M> ? MountedDeferredMutator<M> : never;


export type MutatorTree<R> = {
    [K in keyof R]
    : R[K] extends DeferredMutator<any> ? DeferredMutatorToMountedDeferredMutator<R[K]>
        : R[K] extends Mutator<any> ? R[K]
        : R[K] extends object ? MutatorTree<R[K]>
        : never;
};

export type StateTree<R> = {
    [K in keyof R]
    : R[K] extends MountedDeferredMutator<any> ? MountedDeferredMutatorState<R[K]>
        : R[K] extends Mutator<any> ? MutatorState<R[K]>
        : StateTree<R[K]>;
};

export type MutatorStateOrStateTree<T> =
    T extends Mutator<infer M> ? StateTree<M> : StateTree<T>;

//////////////////////////////////////////

type MergeStateFn = (action: Action,
                     currentState: any,
                     pathOrigin: string,
                     path: string[],
                     stateChange: any,
                     stateSetter: (event: StateChangeEvent<any>) => void) => void;

export interface Action {
    [param: string]: any;

    type: string;
}

export class StateChangeEvent<S> {
    constructor(readonly action: Action,
                readonly state: S,
                readonly changeOriginPath: string) {
    }
}

const mutatorsToStateSymbol = "[__mutators-to-state__]";
const mutatorsLevelPathSymbol = "[__mutators-level-path__]";

function mergeState(action: Action,
                    currentState: any,
                    changeOriginPath: string,
                    path: string[],
                    stateChange: any,
                    stateSetter: (event: StateChangeEvent<any>) => void): void {

    if (path.length === 0) {
        stateSetter(new StateChangeEvent(action, stateChange, changeOriginPath));
        return;
    }

    const parentStateChange: any = {};
    let parentPath = path.slice(0, path.length - 1);
    let parentState = parentPath.length > 0
        ? _.get(currentState, parentPath)
        : currentState;
    Object.assign(parentStateChange, parentState);
    parentStateChange[_.last(path)!] = stateChange;

    return mergeState(
        action,
        currentState,
        changeOriginPath,
        parentPath,
        parentStateChange,
        stateSetter);
}

function addMetaDataToStoreElement(storeElement: any,
                                   path: string[],
                                   stateGetter: () => any) {

    Object.defineProperty(storeElement, mutatorsToStateSymbol, {
        configurable: false,
        enumerable: true,
        get: () => {
            return () => path.length > 0
                ? _.get(stateGetter(), path)
                : stateGetter();
        }
    });

    Object.defineProperty(storeElement, mutatorsLevelPathSymbol, {
        configurable: false,
        enumerable: true,
        value: path.join(".")
    });

}

function instrumentTree(mergeState: MergeStateFn,
                        stateSetter: (event: StateChangeEvent<any>) => void,
                        stateGetter: () => any,
                        rootMutatorsStructure: any,
                        path: string[],
                        structureToMerge: any) {

    _.forIn(structureToMerge, (child, key) => {
        const localPath = _.cloneDeep(path);
        localPath.push(key);

        if (child instanceof DeferredMutator) {
            _.set(stateGetter(), localPath, undefined);
            _.set(rootMutatorsStructure, localPath, child.mount(m => {
                _.set(stateGetter(), localPath, (m as any).initialState);
                delete (child as any).initialState;
                instrumentMutator(mergeState, stateSetter, stateGetter, localPath, m);
            }));
        } else if (child instanceof Mutator) {
            _.set(stateGetter(), localPath, (child as any).initialState);
            delete (child as any).initialState;
            instrumentMutator(mergeState, stateSetter, stateGetter, localPath, child);
            _.set(rootMutatorsStructure, localPath, child);
            addMetaDataToStoreElement(child, localPath, stateGetter);
        } else {
            _.set(stateGetter(), localPath, child);
        }

        if (_.isPlainObject(child)) {
            instrumentTree(
                mergeState,
                stateSetter,
                stateGetter,
                rootMutatorsStructure,
                localPath,
                child);
        } else {

        }
    });

    const currentMutatorsLevel = path.length > 0
        ? _.get(rootMutatorsStructure, path)
        : rootMutatorsStructure;

    addMetaDataToStoreElement(currentMutatorsLevel, path, stateGetter);

}

function instrumentMutator(mergeState: MergeStateFn,
                           stateSetter: (event: StateChangeEvent<StateTree<any>>) => void,
                           stateGetter: () => StateTree<any>,
                           path: string[],
                           mutators: any) {

    for (let mutatorName of _.functionsIn(mutators)) {
        const mutatorFn = mutators[mutatorName];

        mutators[mutatorName] = function () {
            const logMutatorDuration = isTyduxDevelopmentModeEnabled() && isLogMutatorDurationEnabled();

            const args = arguments;
            const tempThis: any = {};

            let storeState = stateGetter();
            const localState = _.get(storeState, path);
            tempThis.state = createProxy(localState);

            Object.setPrototypeOf(tempThis, mutators);

            const start = logMutatorDuration ? Date.now() : 0;
            const result = mutatorFn.apply(tempThis, args);
            let actionName = path.join(".") + "." + mutatorName;

            if (logMutatorDuration) {
                const duration = Date.now() - start;
                actionName += ` (${duration}ms)`;
            }

            mergeState(
                createActionFromArguments(actionName, mutatorFn, args),
                storeState,
                path.join("."),
                path,
                tempThis.state,
                stateSetter);

            return result;
        };

    }
}

export class Store<M> {

    static create<P>(tree: P): Store<MutatorTree<P>> {
        const stateContainer = {
            state: {} as StateTree<MutatorTree<P>>
        };

        const stateChangesSubject = new ReplaySubject<StateChangeEvent<StateTree<MutatorTree<P>>>>(1);

        const stateGetter = () => stateContainer.state;
        const stateSetter = (event: StateChangeEvent<StateTree<MutatorTree<P>>>) => {
            stateContainer.state = event.state;
            stateChangesSubject.next(event);
        };

        const mutatorsStructure: any = {};

        const store = new Store<MutatorTree<P>>(
            mutatorsStructure,
            stateChangesSubject.asObservable(),
            stateGetter
        );

        instrumentTree(
            mergeState,
            stateSetter,
            stateGetter,
            store.mutate,
            [],
            tree);

        mergeState(
            {type: "@@INIT"},
            {},
            "",
            [],
            stateContainer.state,
            stateSetter);

        return store;
    }

    get state(): Readonly<MutatorStateOrStateTree<M>> {
        return this.stateGetter();
    }

    private constructor(readonly mutate: M,
                        readonly stateChanges: Observable<StateChangeEvent<StateTree<M>>>,
                        private readonly stateGetter: () => MutatorStateOrStateTree<M>) {
    }

    bounded(operator: Operator<StateChangeEvent<StateTree<M>>, StateChangeEvent<StateTree<M>>>): StoreObserver<StateTree<M>> {
        return new StoreObserver(this.stateChanges, operator);
    }

    unbounded(): StoreObserver<StateTree<M>> {
        return new StoreObserver(this.stateChanges);
    }

    getView<V>(fn: (store: M) => V): Store<V> {
        let viewMutators = fn(this.mutate);

        const viewStateFn = (viewMutators as any)[mutatorsToStateSymbol];
        const viewPath = (viewMutators as any)[mutatorsLevelPathSymbol];

        // console.log("viewPath", viewPath);
        // console.log("viewStateFn", viewStateFn);
        // console.log("viewStateFn()", viewStateFn());

        return new Store<V>(
            viewMutators,
            this.stateChanges.pipe(
                filter(event => {
                    return _.startsWith(event.changeOriginPath, viewPath);
                }),
                map(event => {
                    return new StateChangeEvent(
                        event.action,
                        viewStateFn(),
                        event.changeOriginPath);
                })
            ) as any,
            viewStateFn) as any;
    }

}
