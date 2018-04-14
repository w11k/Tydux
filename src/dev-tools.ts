import {isTyduxDevelopmentModeEnabled} from "./development";
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

export function enableDevToolsForStore(store: Store<any>) {
    if (!isTyduxDevelopmentModeEnabled()) {
        return;
    }

    const devToolsEnabled = typeof window !== "undefined"
        && (window as any).__REDUX_DEVTOOLS_EXTENSION__ !== undefined;

    if (!devToolsEnabled) {
        return;
    }

    const devTools = devToolsEnabled ? (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect() : undefined;

    // devTools.init(store.state);

    devTools.subscribe((message: any) => {
        if (message.type === "DISPATCH" && message.state) {
            const state: DevToolsState = JSON.parse(message.state);
            switch (message.payload.type) {
                case "TOGGLE_ACTION":
                    const id = message.payload.id;
                    devTools.send(null, state);
                    break;
            }

        }
    });

    store.stateChanges
        .subscribe(event => {
            devTools.send(event.action, event.state);
        });

}
