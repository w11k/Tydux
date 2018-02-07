import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Action, Store} from "./Store";

export class MutatorEvent<S> {
    constructor(readonly storeName: string,
                readonly action: Action,
                readonly state: S,
                readonly boundMutator?: () => void) {
    }
}

const stores: { [name: string]: Store<any, any> } = {};

const globalState: any = {};

const globalStateChangesSubject = new Subject<MutatorEvent<any>>();

export const globalStateChanges$: Observable<MutatorEvent<any>> = globalStateChangesSubject.asObservable();

export function getGlobalTyduxState() {
    return globalState;
}

export function addStoreToGlobalState(storeName: string, store: Store<any, any>) {
    stores[storeName] = store;

    store.events$
            .subscribe((event: MutatorEvent<any>) => {
                globalState[event.storeName] = event.state;
                globalStateChangesSubject.next(event);
            });
}

