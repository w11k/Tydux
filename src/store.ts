import {Action, createStore, Dispatch, Reducer, Store as ReduxStore, Unsubscribe} from "redux";
import {CommandReducer} from "./commands";


export interface MountPoint<S, L> {
    addReducer: (commandReducer: CommandReducer<any>) => void;
    dispatch: Dispatch<Action<string>>;
    getState: () => L;
    extractState: (globalState: S) => L;
    setState: (globalState: S, localState: L) => S;
    subscribe: (listener: () => void) => Unsubscribe;
}


function createMountPointFns(fassadeReducers: CommandReducer<any>[]) {
    function createMountPoint<S, L>(store: ReduxStore<S, any>,
                                    stateGetter: (globalState: S) => L,
                                    stateSetter: (globalState: S, localState: L) => S): MountPoint<S, L> {
        return {
            addReducer: (commandReducer: CommandReducer<any>) => fassadeReducers.push(commandReducer),
            dispatch: store.dispatch.bind(store),
            getState: () => stateGetter(store.getState()),
            extractState: (state: S) => stateGetter(state),
            setState: stateSetter,
            subscribe: store.subscribe.bind(store),
        };
    }

    function createRootMountPoint<S, K extends keyof S>(store: ReduxStore<S, any>, slice: K): MountPoint<S, S[K]> {
        return createMountPoint(
            store,
            s => s[slice],
            (s, l) => {
                const state = Object.assign({}, s);
                state[slice] = l;
                return state;
            }
        );
    }

    return {
        createMountPoint,
        createRootMountPoint
    };
}

export function createTyduxStoreBridge<S>() {
    const fassadeReducers: CommandReducer<any>[] = [];

    const tyduxReducer = (state: S, action: any) => {
        for (let reducer of fassadeReducers) {
            state = reducer(state, action);
        }
        return state;
    };

    const mountPointFns = createMountPointFns(fassadeReducers);

    return {
        wrapReducer: (wrappedReducer: Reducer) =>
            (state: S, action: Action) =>
                wrappedReducer(tyduxReducer(state, action), action),
        createMountPoint: mountPointFns.createMountPoint,
        createRootMountPoint: mountPointFns.createRootMountPoint
    };
}

export class TyduxStore<S> {

    private readonly bridge: ReturnType<typeof createTyduxStoreBridge>;
    private readonly store: ReduxStore<S, Action>;

    constructor(private readonly initialState: S) {
        function noopReducer(state = initialState) {
            return state;
        }
        this.bridge = createTyduxStoreBridge();
        this.store = createStore(this.bridge.wrapReducer(noopReducer));
    }


    getState() {
        return this.store.getState();
    }

    createMountPoint<L>(stateGetter: (globalState: S) => L, stateSetter: (globalState: S, localState: L) => S) {
        return this.bridge.createMountPoint(this.store, stateGetter, stateSetter);
    }

    createRootMountPoint<K extends keyof S>(slice: K) {
        return this.bridge.createRootMountPoint(this.store, slice);
    }

}

export function createTyduxStore<S>(initialState: S): TyduxStore<S> {
    return new TyduxStore<S>(initialState);
}
