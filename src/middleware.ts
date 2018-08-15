import {Action, ProcessedAction, Store} from "./Store";


export type MiddlewareInit<T extends Store<any, S>, S> = (store: T) => Middleware<S>;

export interface Middleware<S> {

    beforeActionDispatch(state: S, action: Action): any;

    afterProcessedAction(processedAction: ProcessedAction<S>): void;

}
