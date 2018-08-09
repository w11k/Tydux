import {
    clearAllStores,
    getGlobalTyduxState,
    globalStateChanges$,
    setStateForAllStores,
    setStoreState
} from "./global-state";

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

export function enableDevTools() {
    const devToolsEnabled = typeof window !== "undefined"
        && (window as any).__REDUX_DEVTOOLS_EXTENSION__ !== undefined;

    if (!devToolsEnabled) {
        return;
    }

    const devTools = devToolsEnabled ? (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect() : undefined;

    devTools.init(getGlobalTyduxState());

    devTools.subscribe((message: any) => {
        if (message.type === "DISPATCH" && message.state) {
            const state: any = JSON.parse(message.state);

            switch (message.payload.type) {
                case "TOGGLE_ACTION":
                    devTools.send(null, state);
                    break;
                case "JUMP_TO_ACTION":
                case "JUMP_TO_STATE":
                    devTools.send(null, state);
                    setStateForAllStores(state);
                    break;
            }
        }
    });

    globalStateChanges$
        .subscribe(event => {
            const meta = event.duration !== undefined ? ` (${event.duration}ms)` : "";
            const action = {
                ...event.action,
                "type": "[" + event.action.type + "]" + meta
            };

            devTools.send(action, getGlobalTyduxState());
        });

}
