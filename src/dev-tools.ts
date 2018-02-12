import * as _ from "lodash";
import {getGlobalTyduxState, globalStateChanges$} from "./global-state";

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

    const mutators: (() => void)[] = [];

    devTools.init(getGlobalTyduxState());

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
                const mutator = !_.isNil(event.boundMutator) ? event.boundMutator : _.noop;
                mutators.push(mutator);
                const meta = event.duration !== undefined ? ` (${event.duration}ms)` : "";
                const action = {
                    ...event.action,
                    "type": "[" + event.storeName + " / " + event.action.type + "]" + meta
                };

                devTools.send(action, getGlobalTyduxState());
            });

}
