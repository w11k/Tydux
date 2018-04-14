import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {filter, map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {StoreObserver} from "./StoreObserver";
import {createActionFromArguments, createProxy} from "./utils";

export class StateMutators<S> {

    protected state!: S;

    // noinspection JSUnusedLocalSymbols: accessed during Store initialization
    constructor(private initialState: S) {
    }
}

export type MutatorsState<G> = G extends StateMutators<infer S> ? Readonly<S> : never;

export type State<S> = {
    [K in keyof S]: S[K] extends StateMutators<any> ? MutatorsState<S[K]> : State<S[K]>;
};

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

function instrumentStructure(mergeState: MergeStateFn,
                             stateSetter: (event: StateChangeEvent<any>) => void,
                             stateGetter: () => any,
                             rootMutatorsStructure: any,
                             path: string[],
                             structureToMerge: any) {

    _.forIn(structureToMerge, (child, key) => {
        const localPath = _.cloneDeep(path);
        localPath.push(key);

        if (child instanceof StateMutators) {
            _.set(stateGetter(), localPath, (child as any).initialState);
            delete (child as any).initialState;
            instrumentMutators(mergeState, stateSetter, stateGetter, localPath, child);
            _.set(rootMutatorsStructure, localPath, child);
        } else {
            _.set(stateGetter(), localPath, child);
        }

        if (_.isPlainObject(child)) {
            instrumentStructure(
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
        enumerable: true,
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
            const tyduxDevelopmentModeEnabled = isTyduxDevelopmentModeEnabled();

            const args = arguments;
            const tempThis: any = {};

            let storeState = stateGetter();
            const localState = _.get(storeState, path);
            tempThis.state = createProxy(localState);

            Object.setPrototypeOf(tempThis, mutators);

            const start = tyduxDevelopmentModeEnabled ? Date.now() : 0;
            const result = mutatorFn.apply(tempThis, args);
            let actionName = path.join(".") + "." + mutatorName;

            if (tyduxDevelopmentModeEnabled) {
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

export class Store<S> {

    static create<S>(structure: S): Store<S> {
        const stateContainer = {
            state: {} as State<S>
        };

        const stateChangesSubject = new ReplaySubject<StateChangeEvent<State<S>>>(1);

        const stateGetter = () => stateContainer.state;
        const stateSetter = (event: StateChangeEvent<State<S>>) => {
            stateContainer.state = event.state;
            stateChangesSubject.next(event);
        };

        const mutatorsStructure: any = {};

        const store = new Store<S>(
            mutatorsStructure,
            stateChangesSubject.asObservable(),
            stateGetter
        );

        instrumentStructure(
            mergeState,
            stateSetter,
            stateGetter,
            store.mutate,
            [],
            structure);

        mergeState(
            {type: "@@INIT"},
            {},
            "",
            [],
            stateContainer.state,
            stateSetter);

        return store;
    }

    get state(): Readonly<State<S>> {
        return this.stateGetter();
    }

    private constructor(readonly mutate: S,
                        readonly stateChanges: Observable<StateChangeEvent<State<S>>>,
                        private readonly stateGetter: () => State<S>) {
    }

    bounded(operator: Operator<StateChangeEvent<State<S>>, StateChangeEvent<State<S>>>): StoreObserver<State<S>> {
        return new StoreObserver(this.stateChanges, operator);
    }

    unbounded(): StoreObserver<State<S>> {
        return new StoreObserver(this.stateChanges);
    }

    getView<C>(fn: (store: S) => C): Store<C> {
        let viewMutators = fn(this.mutate);

        const viewStateFn = (viewMutators as any)[mutatorsToStateSymbol];
        const viewPath = (viewMutators as any)[mutatorsLevelPathSymbol];

        return new Store<C>(
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
