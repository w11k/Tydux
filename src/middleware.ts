import {Action, ProcessedAction, Store} from "./Store";


export interface Middleware<T extends Store<any, S>, S> {

    init(store: T, setStateFn: (action: Action, state: S) => void): void;

    beforeActionDispatch(store: T, state: S, action: Action): any;

    afterProcessedAction(store: T, processedAction: ProcessedAction<S>): void;

}
