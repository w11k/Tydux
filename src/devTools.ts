import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Store} from "./Store";


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

let developmentMode = false;

const devToolsEnabled = typeof window !== "undefined"
        && (window as any).__REDUX_DEVTOOLS_EXTENSION__ !== undefined;

const devTools = devToolsEnabled ? (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect() : undefined;

const stores: { [name: string]: Store<any, any> } = {};

const modifiers: (() => void)[] = [];

const globalState: any = {};

const globalStateChangesSubject = new Subject<any>();

export const globalStateChanges$: Observable<any> = globalStateChangesSubject.asObservable();

if (devToolsEnabled) {
    devTools.init(globalState);
    devTools.subscribe((message: any) => {
        console.log(message);
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
}

export function enableDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
}

export function isDevelopmentModeEnabled() {
    return developmentMode;
}

export function subscribeStore(name: string, store: Store<any, any>) {
    if (!devToolsEnabled) {
        return;
    }

    stores[name] = store;

    store.events$
            .subscribe(event => {
                const modifier = event.boundModifier ? event.boundModifier : _.noop;
                modifiers.push(modifier);
                const action = {
                    ...event.action,
                    "type": "[" + name + "] " + event.action.type
                };

                globalState[name] = event.state;
                devTools.send(action, globalState);
            });

}

function dispatchAction(storeName: string, action: any) {

}
