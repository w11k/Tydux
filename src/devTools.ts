import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Store} from "./Store";

let developmentMode = false;

const devToolsEnabled = typeof window !== "undefined"
    && (window as any).devToolsExtension !== undefined;

const devTools = devToolsEnabled ? (window as any).devToolsExtension.connect() : undefined;

const stores: { [name: string]: Store<any, any> } = {};

const globalState: any = {};

const globalStateChangesSubject = new Subject<any>();

export const globalStateChanges$: Observable<any> = globalStateChangesSubject.asObservable();

if (devToolsEnabled) {
    devTools.subscribe((message: any) => {
        if (message.type === "DISPATCH" && message.state) {
            console.log("DevTools requested to change the state");
            console.log(message);
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
