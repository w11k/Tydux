import {isNil} from "@w11k/rx-ninja";
import {Action, AnyAction, createStore, Dispatch, Reducer, Store, StoreEnhancer, Unsubscribe} from "redux";
import {Observable} from "rxjs";
import {CommandReducer} from "./commands";


export interface MountPoint<L, S = any, A extends Action = Action<string>> {
  addReducer: (commandReducer: CommandReducer<any>) => void;
  dispatch: Dispatch<A>;
  getState: () => L;
  extractState: (globalState: S) => L;
  setState: (globalState: S, localState: L) => S;
  subscribe: (listener: () => void) => Unsubscribe;
}

export interface NamedMountPoint<L, S = any, A extends Action = Action<string>> extends MountPoint<L, S, A> {
  sliceName: string;
}

export class TyduxStore<S = any, A extends Action = Action<string>> {

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

  createMountPoint<L>(stateGetter: (globalState: S) => L,
                      stateSetter: (globalState: S, localState: L) => S): MountPoint<L, S, A> {
    return {
      addReducer: (commandReducer: CommandReducer<any>) => this.facadeReducers.push(commandReducer),
      dispatch: <T extends A>(action: T) => this.store.dispatch(action),
      getState: () => stateGetter(this.store.getState()),
      extractState: (state: S) => stateGetter(state),
      setState: stateSetter,
      subscribe: this.store.subscribe.bind(this.store),
    };
  }

  createRootMountPoint<K extends keyof S>(slice: K): NamedMountPoint<S[K], S, A> {
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
      return state!;
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

export function createTyduxStore<S, A extends Action = AnyAction>(initialState: S,
                                                                  enhancer?: StoreEnhancer<any>,
                                                                  reducer?: Reducer<S, A>): TyduxStore<S> {

  const bridge = new TyduxReducerBridge();

  const rootReducer = isNil(reducer)
    ? bridge.createTyduxReducer(initialState)
    : bridge.wrapReducer(reducer);

  const reduxStore = createStore(
    rootReducer,
    initialState as any /*cast due to strange TS error*/,
    enhancer);

  return bridge.connectStore(reduxStore);
}
