import {Mutator, MutatorAction, MutatorDispatcher, MutatorMethods} from "./mutator";
import {ProcessedAction, Store, StoreConnector} from "./Store";
import {isNil} from "./utils";


export class MiddlewareInit<S> {
    constructor(readonly storeConnector: StoreConnector<S>,
                readonly mutatorDispatcher: MutatorDispatcher) {
    }
}

export abstract class Middleware<S, M extends Mutator<S>, T extends Store<any, S>> {

    mutate!: MutatorMethods<M>;

    private storeConnector!: StoreConnector<S>;

    protected mutatorDispatcher!: MutatorDispatcher;

    abstract getName(): string;

    getMutator(): M {
        return new Mutator() as M;
    }

    get state(): Readonly<S> {
        return this.storeConnector.state;
    }

    initMiddleware(middlewareInit: MiddlewareInit<S>) {
        if (!isNil(this.storeConnector) || !isNil(this.mutatorDispatcher)) {
            throw new Error("Middlware is already initialized.");
        }

        this.storeConnector = middlewareInit.storeConnector;
        this.mutatorDispatcher = middlewareInit.mutatorDispatcher;
    }

    beforeActionDispatch(state: S, action: MutatorAction): boolean | void {
    }

    afterActionProcessed(processedAction: ProcessedAction<S>): void {
    }

}
