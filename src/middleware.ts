import {Action, ProcessedAction, Store} from "./Store";


export type MiddlewareInit<T extends Store<any, S>, S> = (store: T, state: S) => Middleware<S>;

export interface Middleware<S> {

    beforeActionDispatch(state: S, action: Action): any;

    afterActionProcessed(processedAction: ProcessedAction<S>): void;

}
