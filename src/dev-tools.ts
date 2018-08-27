import {getGlobalTyduxState, globalStateChanges$, setStateForAllStores} from "./global-state";
import {isNil} from "./utils";

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
        if (message.type === "DISPATCH" && message.payload.type === "COMMIT") {
            console.error("not yet supported (https://github.com/w11k/Tydux/blob/master/doc/redux-devtools.md)");
        }
    });

    globalStateChanges$
        .subscribe(event => {
            const origin = event.storeId;
            const context = isNil(event.context) ? "" : "#" + event.context;
            const meta = event.duration !== undefined ? ` (${event.duration}ms)` : "";
            const type = `[${origin + context} / ${event.mutatorAction.type}] ${meta}`;

            const action = {
                ...event.mutatorAction,
                type
            };

            devTools.send(action, getGlobalTyduxState());
        });

}
