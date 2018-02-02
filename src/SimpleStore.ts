import {Mutators, Store} from "./Store";


class SimpleStoreImpl<M extends Mutators<S>, S> extends Store<M, S> {

    constructor(storeName: string, mutators: M, state: S) {
        super(storeName, mutators, state);
    }
}

export type SimpleStore<M extends Mutators<S>, S> =
        Store<M, S>
        // & { readonly [P in keyof M]: M[P]; }
        & { mutate: M };

export function createSimpleStore<M extends Mutators<S>, S>(name: string,
                                                            mutators: M,
                                                            initialState: S): SimpleStore<M, S> {

    const store: any = new SimpleStoreImpl(name, mutators, initialState);

    // enable access to mutators
    // for (let mutatorName of store.mutatorNames) {
    //     store[mutatorName] = function () {
    //         (mutators as any)[mutatorName].apply(mutators, arguments);
    //     };
    // }

    store.mutate = store.dispatch;

    return store as any;
}

