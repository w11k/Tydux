import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {filter, map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {DeferredStateMutators} from "./DeferredStateMutators";
import {isLogMutatorDurationEnabled, isTyduxDevelopmentModeEnabled} from "./development";
import {MutatorState, StateMutators} from "./mutators";
import {StoreObserver} from "./StoreObserver";
import {createActionFromArguments, createProxy} from "./utils";


export type MountedDeferredMutatorState<M> = M extends MountedDeferredStateMutators<infer S> ? MutatorState<S> : never;

export type State<R> = {
    [K in keyof R]
    : R[K] extends StateMutators<any> ? MutatorState<R[K]>
        : R[K] extends MountedDeferredStateMutators<any> ? MountedDeferredMutatorState<R[K]>
        : State<R[K]>;
};

export type MountedDeferredStateMutators<S> = {
    resolve(): void;
    get(): Promise<S>;
};

export type MountedDeferredStateMutatorsType<D> = D extends DeferredStateMutators<infer M> ? MountedDeferredStateMutators<M> : never;


export type MutatorsTree<R> = {
    [K in keyof R]
    : R[K] extends DeferredStateMutators<any> ? MountedDeferredStateMutatorsType<R[K]>
        : R[K] extends StateMutators<any> ? R[K]
        : R[K] extends object ? MutatorsTree<R[K]>
        : R[K];
};

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

function instrumentTree(mergeState: MergeStateFn,
                        stateSetter: (event: StateChangeEvent<any>) => void,
                        stateGetter: () => any,
                        rootMutatorsStructure: any,
                        path: string[],
                        structureToMerge: any) {

    _.forIn(structureToMerge, (child, key) => {
        const localPath = _.cloneDeep(path);
        localPath.push(key);

        if (child instanceof DeferredStateMutators) {
            _.set(stateGetter(), localPath, undefined);
            _.set(rootMutatorsStructure, localPath, child.mount(m =>
                instrumentMutators(mergeState, stateSetter, stateGetter, localPath, m)));
        } else if (child instanceof StateMutators) {
            _.set(stateGetter(), localPath, (child as any).initialState);
            delete (child as any).initialState;
            instrumentMutators(mergeState, stateSetter, stateGetter, localPath, child);
            _.set(rootMutatorsStructure, localPath, child);
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

    Object.defineProperty(currentMutatorsLevel, mutatorsToStateSymbol, {
        configurable: false,
        enumerable: false,
        get: () => {
            return () => path.length > 0
                ? _.get(stateGetter(), path)
                : stateGetter();
        }
    });

    Object.defineProperty(currentMutatorsLevel, mutatorsLevelPathSymbol, {
        configurable: false,
        enumerable: false,
        value: path.join(".")
    });

}

function instrumentMutators(mergeState: MergeStateFn,
                            stateSetter: (event: StateChangeEvent<State<any>>) => void,
                            stateGetter: () => State<any>,
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

    static create<P>(tree: P): Store<MutatorsTree<P>> {
        const stateContainer = {
            state: {} as State<MutatorsTree<P>>
        };

        const stateChangesSubject = new ReplaySubject<StateChangeEvent<State<MutatorsTree<P>>>>(1);

        const stateGetter = () => stateContainer.state;
        const stateSetter = (event: StateChangeEvent<State<MutatorsTree<P>>>) => {
            stateContainer.state = event.state;
            stateChangesSubject.next(event);
        };

        const mutatorsStructure: any = {};

        const store = new Store<MutatorsTree<P>>(
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

    get state(): Readonly<State<M>> {
        return this.stateGetter();
    }

    private constructor(readonly mutate: M,
                        readonly stateChanges: Observable<StateChangeEvent<State<M>>>,
                        private readonly stateGetter: () => State<M>) {
    }

    bounded(operator: Operator<StateChangeEvent<State<M>>, StateChangeEvent<State<M>>>): StoreObserver<State<M>> {
        return new StoreObserver(this.stateChanges, operator);
    }

    unbounded(): StoreObserver<State<M>> {
        return new StoreObserver(this.stateChanges);
    }

    getView<V>(fn: (store: M) => V): Store<V> {
        let viewMutators = fn(this.mutate);

        const viewStateFn = (viewMutators as any)[mutatorsToStateSymbol];
        const viewPath = (viewMutators as any)[mutatorsLevelPathSymbol];

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
            viewStateFn);
    }

}
