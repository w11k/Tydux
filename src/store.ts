import {Action, createStore, Dispatch, Reducer, Store, StoreEnhancer, Unsubscribe} from "redux";
import {CommandReducer} from "./commands";


export interface MountPoint<L, S = any> {
    addReducer: (commandReducer: CommandReducer<any>) => void;
    dispatch: Dispatch<Action<string>>;
    getState: () => L;
    extractState: (globalState: S) => L;
    setState: (globalState: S, localState: L) => S;
    subscribe: (listener: () => void) => Unsubscribe;
}

export interface NamedMountPoint<L, S = any> extends MountPoint<L, S> {
    sliceName: string;
}

export class TyduxStore<S> {

    constructor(readonly store: Store<S>,
                private readonly fassadeReducers: CommandReducer<any>[]) {
    }

    getState() {
        return this.store.getState();
    }

    createMountPoint<L>(stateGetter: (globalState: S) => L,
                        stateSetter: (globalState: S, localState: L) => S): MountPoint<L, S> {
        return {
            addReducer: (commandReducer: CommandReducer<any>) => this.fassadeReducers.push(commandReducer),
            dispatch: this.store.dispatch.bind(this.store),
            getState: () => stateGetter(this.store.getState()),
            extractState: (state: S) => stateGetter(state),
            setState: stateSetter,
            subscribe: this.store.subscribe.bind(this.store),
        };
    }

    createRootMountPoint<K extends keyof S>(slice: K): NamedMountPoint<S[K], S> {
        return ({
                sliceName: slice.toString(),
                ...this.createMountPoint(
                    s => s[slice],
                    (s, l) => {
                        const state = Object.assign({}, s);
                        state[slice] = l;
                        return state;
                    }
                )
            }
        );
    }

}

export class TyduxReducerBridge {

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
        return (state: S | undefined, action: Action) => wrappedReducer(this.reducer()(state, action), action);
    }

    connectStore<S>(store: Store<S>) {
        return new TyduxStore<S>(store, this.fassadeReducers);
    }

}

// export interface TyduxMiddlewareBridge<S> {
//     (): void;
// }
// function createTyduxStoreMiddleware<S>(store: { getState(): S, dispatch(action: any): void }) {
//     const bridge = new TyduxReducerBridge();
//     const subject = new Subject<S>();
//     const subscribe = (listener: () => void) => {
//         const subscription = subject.subscribe(() => {
//             listener();
//         });
//         return () => {
//             subscription.unsubscribe();
//         }
//     };
//
//     const storeWithSubscribe = Object.assign({subscribe}, store);
//     let connected = bridge.connectStore(storeWithSubscribe);
//
//     return (next: any) => (action: any) => {
//         return next(action);
//     }
// }

export function createTyduxStore<S>(initialState: S,
                                    enhancer?: StoreEnhancer<any>,
                                    reducer = (state: S | undefined, action: any) => state): TyduxStore<S> {

    const bridge = new TyduxReducerBridge();
    const reduxStore = createStore(
        bridge.wrapReducer(reducer),
        initialState as any /*cast due to strange TS error*/,
        enhancer);

    return bridge.connectStore(reduxStore);
}
