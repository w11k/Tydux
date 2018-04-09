import {Operator} from "rxjs/Operator";
import {Mutators} from "./mutators";
import {Store} from "./Store";


export class StoreObserver<M extends Mutators<S>, S> {

    constructor(readonly store: Store<M, S>,
                private readonly operator?: Operator<S, S>) {

    }

}
