import {isNil} from "@w11k/rx-ninja";
import {enableAllPlugins} from "immer";
import {Action, AnyAction, createStore, Dispatch, Reducer, Store, StoreEnhancer, Unsubscribe} from "redux";
import {EnhancerOptions} from "redux-devtools-extension";
import {Observable, ReplaySubject, Subject} from "rxjs";
import {CommandReducer} from "./commands";
import {checkDevModeAndCreateDevToolsEnabledComposeFn, isTyduxDevelopmentModeEnabled} from "./development";
import {getDeep, setDeep} from "./utils";

export interface MountPoint<L, S = any, A extends Action = Action<string>> {
    tyduxStore: TyduxStore<S, A>;
    addReducer: (commandReducer: CommandReducer<any>) => void;
    dispatch: Dispatch<A>;
    getState: () => L;
    extractState: (globalState: S) => L;
    setState: (globalState: S, localState: L) => S;
    subscribe: (listener: () => void) => Unsubscribe;
    freeSlicePath: () => void;
    destroySubject: Subject<void>;
}

export interface NamedMountPoint<L, S = any, A extends Action = Action<string>> extends MountPoint<L, S, A> {
    sliceName: string;
}

function throwErrorOnInvalidSliceNamePath(sliceNamePath: string) {
    // TODO: check all characters instead of only ' '
    if (sliceNamePath.indexOf(" ") !== -1) {
        throw new Error("sliceNamePath contains whitespace");
    }
}

export class TyduxStore<S = any, A extends Action = Action<string>> {

    private readonly knownSlicePaths: { [name: string]: boolean; } = {};

    constructor(readonly store: Store<S, A>,
                private readonly facadeReducers: CommandReducer<any>[]) {
    }

    getState() {
        return this.store.getState();
    }

    select(): Observable<S> {
        return new Observable<S>(observer => {
            observer.next(this.store.getState());
            return this.store.subscribe(() => {
                Promise.resolve().then(() => observer.next(this.store.getState()));
            });
        });
    }

    private internalCreateMountPoint<L>(stateGetter: (globalState: S) => L,
                                        stateSetter: (globalState: S, localState: L) => S,
                                        freeSlicePath: () => void): MountPoint<L, S, A> {

        return {
            tyduxStore: this,
            addReducer: (commandReducer: CommandReducer<any>) => this.facadeReducers.push(commandReducer),
            dispatch: <T extends A>(action: T) => this.store.dispatch(action),
            getState: () => stateGetter(this.store.getState()),
            extractState: (state: S) => stateGetter(state),
            setState: stateSetter,
            subscribe: this.store.subscribe.bind(this.store),
            freeSlicePath,
            destroySubject: new ReplaySubject(1),
        };
    }

    private registerSlicePath(path: string) {
        if (this.knownSlicePaths[path]) {
            throw new Error("slice path already in use");
        }
        this.knownSlicePaths[path] = true;
    }

    createMountPoint<K extends keyof S>(sliceName: K): NamedMountPoint<S[K], S, A> {
        this.registerSlicePath(sliceName as string);
        return ({
                sliceName: sliceName.toString(),
                ...this.internalCreateMountPoint(
                    s => s[sliceName],
                    (s, l) => {
                        const state = Object.assign({}, s);
                        state[sliceName] = l;
                        return state;
                    },
                    () => this.knownSlicePaths[sliceName as string] = false,
                ),
            }
        );
    }

    createDeepMountPoint(sliceNamePath: string): NamedMountPoint<any, S, A> {
        if (isTyduxDevelopmentModeEnabled()) {
            throwErrorOnInvalidSliceNamePath(sliceNamePath);
        }
        this.registerSlicePath(sliceNamePath);
        return ({
                sliceName: sliceNamePath,
                ...this.internalCreateMountPoint(
                    s => getDeep(s, sliceNamePath),
                    (s, l) => {
                        return setDeep(s, sliceNamePath, l);
                    },
                    () => this.knownSlicePaths[sliceNamePath as string] = false,
                )
            }
        );
    }

}

export class TyduxReducerBridge {

    private readonly facadeReducers: CommandReducer<any>[] = [];

    createTyduxReducer<S = any, A extends Action = AnyAction>(initialState?: S): Reducer<S, A> {
        let firstCall = true;
        return (state: S | undefined, action: A) => {
            if (firstCall) {
                state = state === undefined ? initialState : state;
                firstCall = false;
            }

            for (const reducer of this.facadeReducers) {
                state = reducer(state, action);
            }
            return state as S;
        };
    }

    wrapReducer<S, A extends Action = AnyAction>(wrappedReducer: Reducer<S, A>): Reducer<S, A> {
        const tyduxReducer = this.createTyduxReducer<S, A>(undefined);
        return (state, action) => {
            const stateAfterWrappedReducer: S = wrappedReducer(state, action);
            return tyduxReducer(stateAfterWrappedReducer, action);
        };
    }

    connectStore<S>(store: Store<S>): TyduxStore<S> {
        return new TyduxStore<S>(store, this.facadeReducers);
    }

}

export function createTyduxStore<S = any, A extends Action = AnyAction>(
    initialState: S = {} as any,
    config: {
        name?: EnhancerOptions["name"],
        reducer?: Reducer<S, A>,
        enhancer?: StoreEnhancer<any>,
    } = {}
): TyduxStore<S> {
    enableAllPlugins();
    const bridge = new TyduxReducerBridge();

    const rootReducer = isNil(config.reducer)
        ? bridge.createTyduxReducer(initialState)
        : bridge.wrapReducer(config.reducer);

    const enhancer = checkDevModeAndCreateDevToolsEnabledComposeFn({
        name: config ? config.name : undefined
    });

    const reduxStore = (createStore as any)/*cast due to strange TS error*/(
        rootReducer,
        initialState,
        config.enhancer ? enhancer(config.enhancer) : enhancer()
    );

    return bridge.connectStore(reduxStore);
}
