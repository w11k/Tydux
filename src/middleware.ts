import {Mutator} from "./mutator";
import {Store} from "./Store";


// export class StoreMiddlewareConnector<S, T extends Store<any, S>> {
//     constructor(readonly store: T) {}
// }

export class MiddlewareMutator<S> extends Mutator<S> {
}

export class Middleware<S, T extends Store<any, S>, M extends MiddlewareMutator<S>>
    extends Store<any, S> {

    constructor(store: T, mutator: M) {
        super(store.storeId + "(mutator)", mutator, store.state);
    }



    // beforeActionDispatch(state: S, action: Action): any {
    //
    // }
    //
    // afterActionProcessed(processedAction: ProcessedAction<S>): void {
    //
    // }


}
