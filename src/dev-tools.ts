import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Store} from "./Store";

export class MutatorEvent<S> {
    constructor(readonly storeName: string,
                readonly action: any,
                readonly state: S,
                readonly boundMutator?: () => void) {
    }
}

interface DevToolsState {
    actionsById: {
        [id: string]: any;
    };
    computedStates: { state: any }[];
    currentStateIndex: number;
    nextActionId: number;
    skippedActionIds: number[];
    stagedActionIds: number[];
}

const devToolsEnabled = typeof window !== "undefined"
    && (window as any).__REDUX_DEVTOOLS_EXTENSION__ !== undefined;

const devTools = devToolsEnabled ? (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect() : undefined;

const stores: { [name: string]: Store<any, any> } = {};

const mutators: (() => void)[] = [];

const globalState: any = {};

const globalStateChangesSubject = new Subject<MutatorEvent<any>>();

export const globalStateChanges$: Observable<MutatorEvent<any>> = globalStateChangesSubject.asObservable();

if (devToolsEnabled) {
    devTools.init(globalState);

    devTools.subscribe((message: any) => {
        // console.log(message);
        if (message.type === "DISPATCH" && message.state) {
            const state: DevToolsState = JSON.parse(message.state);
            // console.log(state);
            switch (message.payload.type) {
                case "TOGGLE_ACTION":
                    const id = message.payload.id;
                    console.log(state);

                    devTools.send(null, state);
                    break;
            }

        }
    });

    globalStateChanges$
        .subscribe(event => {

            const mutator = event.boundMutator ? event.boundMutator : _.noop;
            mutators.push(mutator);
            const action = {
                ...event.action,
                "type": "[" + event.storeName + "] " + event.action.type
            };

            globalState[event.storeName] = event.state;
            devTools.send(action, globalState);

        });
}

export function subscribeStore(storeName: string, store: Store<any, any>) {
    stores[storeName] = store;

    store.events$
        .subscribe(event => {
            globalStateChangesSubject.next(event);
        });
}

function dispatchAction(storeName: string, action: any) {

}
