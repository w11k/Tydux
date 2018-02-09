import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Action, Store} from "./Store";

export class MutatorEvent {
    constructor(readonly storeName: string,
                readonly action: Action,
                readonly boundMutator: () => void) {
    }
}

const stores: { [name: string]: Store<any, any> } = {};

let globalState: any = {};

const globalStateChangesSubject = new Subject<MutatorEvent>();

export const globalStateChanges$: Observable<MutatorEvent> = globalStateChangesSubject.asObservable();

export function getGlobalTyduxState() {
    return globalState;
}

export function addStoreToGlobalState(store: Store<any, any>) {
    stores[store.storeName] = store;
    store.mutatorEvents$
            .subscribe((event: MutatorEvent) => {
                globalState[event.storeName] = store.state;
                globalStateChangesSubject.next(event);
            });
}

export function replayMutatorEvents() {
    globalState = {};

}
