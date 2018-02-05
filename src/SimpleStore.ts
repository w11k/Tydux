import * as _ from "lodash";
import {Mutators} from "./mutators";
import {Store} from "./Store";


class SimpleStoreImpl<M extends Mutators<S>, S> extends Store<M, S> {

    constructor(storeName: string, mutators: M, state: S) {
        super(storeName, mutators, state);
    }
}

export type SimpleStore<M extends Mutators<S>, S> =
    Store<M, S>
    & { readonly [P in keyof M]: M[P]; };

export function createSimpleStore<M extends Mutators<S>, S>(name: string,
                                                            mutators: M,
                                                            initialState: S): SimpleStore<M, S> {

    const store: any = new SimpleStoreImpl(name, mutators, initialState);

    // enable access to mutators
    let baseFnNames = _.functionsIn(Mutators.prototype);
    const mutatorNames =  _.difference(_.functionsIn(mutators), baseFnNames);

    const basePrototype: any = {};
    Object.setPrototypeOf(basePrototype, Object.getPrototypeOf(store));
    Object.setPrototypeOf(store, basePrototype);

    for (let mutatorName of mutatorNames) {
        basePrototype[mutatorName] = function () {
            (mutators as any)[mutatorName].apply(mutators, arguments);
        };
    }

    // store.instrumentStoreMethods();
    return store as any;
}

