import {Action, createStore, Dispatch, Reducer, Store, Unsubscribe} from "redux";
import {CommandReducer} from "./commands";


export interface MountPoint<S, L> {
    addReducer: (commandReducer: CommandReducer<any>) => void;
    dispatch: Dispatch<Action<string>>;
    getState: () => L;
    extractState: (globalState: S) => L;
    setState: (globalState: S, localState: L) => S;
    subscribe: (listener: () => void) => Unsubscribe;
}

export class ConnectedTyduxStoreBridge<S> {

    constructor(private readonly store: Store<S>,
                private readonly fassadeReducers: CommandReducer<any>[]) {
    }

    createMountPoint<L>(stateGetter: (globalState: S) => L,
                        stateSetter: (globalState: S, localState: L) => S): MountPoint<S, L> {
        return {
            addReducer: (commandReducer: CommandReducer<any>) => this.fassadeReducers.push(commandReducer),
            dispatch: this.store.dispatch.bind(this.store),
            getState: () => stateGetter(this.store.getState()),
            extractState: (state: S) => stateGetter(state),
            setState: stateSetter,
            subscribe: this.store.subscribe.bind(this.store),
        };
    }

    createRootMountPoint<K extends keyof S>(slice: K): MountPoint<S, S[K]> {
        return this.createMountPoint(
            s => s[slice],
            (s, l) => {
                const state = Object.assign({}, s);
                state[slice] = l;
                return state;
            }
        );
    }

}

export class TyduxStoreBridge {

    private readonly fassadeReducers: CommandReducer<any>[] = [];

    private readonly reducer = (initialState?: any) => (state: any = initialState, action: any) => {
        for (let reducer of this.fassadeReducers) {
            state = reducer(state, action);
        }
        return state;
    };

    createTyduxReducer<S>(initialState?: S): Reducer<S> {
        return this.reducer(initialState);
    }

    wrapReducer<S>(wrappedReducer: Reducer<S>): Reducer<S> {
        return (state: S|undefined, action: Action) => wrappedReducer(this.reducer()(state, action), action);
    }

    connectStore<S>(store: Store<S>) {
        return new ConnectedTyduxStoreBridge<S>(store, this.fassadeReducers);
    }

}

///////////////////////////////////////////////////////////////////////////////

export class TyduxStore<S> {

    private readonly connectedTyduxStoreBridge: ConnectedTyduxStoreBridge<S>;
    private readonly store: Store<S, Action>;

    constructor(private readonly initialState: S|undefined) {
        function noopReducer(state = initialState) {
            return state;
        }

        const bridge = new TyduxStoreBridge();
        this.store = createStore(bridge.wrapReducer(noopReducer));
        this.connectedTyduxStoreBridge = bridge.connectStore(this.store);
    }


    getState() {
        return this.store.getState();
    }

    createMountPoint<L>(stateGetter: (globalState: S) => L, stateSetter: (globalState: S, localState: L) => S) {
        return this.connectedTyduxStoreBridge.createMountPoint(stateGetter, stateSetter);
    }

    createRootMountPoint<K extends keyof S>(slice: K) {
        return this.connectedTyduxStoreBridge.createRootMountPoint(slice);
    }

}

export function createTyduxStore<S>(initialState: S): TyduxStore<S> {
    return new TyduxStore<S>(initialState);
}
