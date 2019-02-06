/*
import {Commands, MutatorAction, CommandDispatcher, CommandsMethods} from "./commands";
import {ProcessedAction, Facade, StoreConnector} from "./Facade";
import {isNil} from "./utils";


export class MiddlewareInit<S> {
    constructor(readonly storeConnector: StoreConnector<S>,
                readonly mutatorDispatcher: CommandDispatcher) {
    }
}

export abstract class Middleware<S, M extends Commands<S>, T extends Facade<any, S>> {

    mutate!: CommandsMethods<M>;

    private storeConnector!: StoreConnector<S>;

    protected mutatorDispatcher!: CommandDispatcher;

    abstract getName(): string;

    getMutator(): M {
        return new Commands() as M;
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

    /!**
     * Called by the store before a dispatched action gets executed by the mutator.
     * If this method returns false, the dispatched action will be cancelled.
     *
     * @param state The current store's state
     * @param action The dispatched action
     *!/
    beforeActionDispatch(state: S, action: MutatorAction): false | void {
    }

    /!**
     * Called by the store after a dispatched action was executed by the mutator.
     *!/
    afterActionProcessed(processedAction: ProcessedAction<S>): void {
    }

}
*/
