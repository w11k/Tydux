import {Mutator, MutatorAction, MutatorMethods, MutatorReducer} from "./mutator";
import {ProcessedAction, Store, StoreConnector} from "./Store";


export class MiddlewareInit<S> {
    constructor(readonly storeConnector: StoreConnector<S>,
                readonly mutatorReducer: MutatorReducer<S>) {
    }
}

export abstract class Middleware<S, M extends Mutator<S>, T extends Store<any, S>> {

    mutate!: MutatorMethods<M>;

    private readonly storeConnector: StoreConnector<S>;

    protected readonly mutatorReducer: MutatorReducer<S>;

    constructor(middlewareInit: MiddlewareInit<S>, readonly mutator: M) {
        this.storeConnector = middlewareInit.storeConnector;
        this.mutatorReducer = middlewareInit.mutatorReducer;
    }

    abstract getName(): string;

    get state(): Readonly<S> {
        return this.storeConnector.state;
    }

    beforeActionDispatch(state: S, action: MutatorAction): boolean | void {
    }

    afterActionProcessed(processedAction: ProcessedAction<S>): void {
    }

}
