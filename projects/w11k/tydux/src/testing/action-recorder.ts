export type StateAndAction<S> = { state: S, action: { type: string } };

export class ActionRecorder<S = any> {

    private readonly stateAndAction: StateAndAction<S>[] = [];

    private readonly reducer = (state: S, action: { type: string }) => {
        this.stateAndAction.push({action, state});
        return state;
    };

    getReducer() {
        return this.reducer;
    }

    getAllActions() {
        return this.stateAndAction;
    }

    getActionCount(actionType: string) {
        return this.getActionAndStateListForType(actionType).length;
    }

    getActionAndStateListForType(actionType: string) {
        return this.stateAndAction.filter(a => a.action.type === actionType);
    }

    getFirstActionAndStateForType(actionType: string): StateAndAction<S> | undefined {
        const list = this.stateAndAction.filter(a => a.action.type === actionType);
        return list.length > 0 ? list[0] : undefined;
    }

    getLastActionAndStateForType(actionType: string): StateAndAction<S> | undefined {
        const list = this.stateAndAction.filter(a => a.action.type === actionType);
        return list.length > 0 ? list[list.length - 1] : undefined;
    }

}
