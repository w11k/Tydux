import {Action, Dispatch, Store as ReduxStore, Unsubscribe} from "redux";
import {ReplaySubject, Subject} from "rxjs";
import {CommandReducer, Commands, CommandsMethods, createReducerFromCommands} from "./commands";
import {mutatorHasInstanceMembers} from "./error-messages";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {createProxy, functions, functionsIn} from "./utils";

export function failIfInstanceMembersExistExceptState(obj: any) {
    const members = Object.keys(obj).filter(key => key !== "state");
    if (members.length > 0) {
        throw new Error(mutatorHasInstanceMembers + ": " + members.join(", "));
    }
}

const tyduxStoreReducerList: CommandReducer<any>[] = [];

export function tyduxReducer(state: any, action: any) {
    for (let reducer of tyduxStoreReducerList) {
        state = reducer(state, action);
    }
    return state;
}

let uniqueFassadeIds: { [id: string]: number } = {};

function createUniqueFassadeId(name: string) {
    if (uniqueFassadeIds[name] === undefined) {
        uniqueFassadeIds[name] = 1;
    } else {
        uniqueFassadeIds[name] += 1;
    }

    const count = uniqueFassadeIds[name];
    if (count === 1) {
        return name;
    } else {
        return `${name}(${count})`;
    }
}

export function resetFassadeIds() {
    uniqueFassadeIds = {};
}

export interface FassadeAction extends Action<string> {
    payload: any[];
    debugContext?: string;
}

export interface MountPoint<S, L> {
    dispatch: Dispatch<Action<string>>;
    getState: () => L;
    extractState: (globalState: S) => L;
    setState: (globalState: S, localState: L) => S;
    subscribe: (listener: () => void) => Unsubscribe;
}

export function createMountPoint<S, L>(store: ReduxStore<S, any>,
                                       stateGetter: (globalState: S) => L,
                                       stateSetter: (globalState: S, localState: L) => S): MountPoint<S, L> {
    return {
        dispatch: store.dispatch.bind(store),
        getState: () => stateGetter(store.getState()),
        extractState: (state: S) => stateGetter(state),
        setState: stateSetter,
        subscribe: store.subscribe.bind(store),
    };
}

export abstract class Fassade<S, M extends Commands<S>> {

    readonly fassadeId: string;

    private destroyed = false;

    // private _undeliveredProcessedActionsCount = 0;

    private readonly commandContextCallstack: string[] = [];

    private readonly reduxStoreStateSubject: Subject<S> = new ReplaySubject<S>(1);

    // private readonly processedActionsSubject = new ReplaySubject<ProcessedAction<S>>(1);
    // readonly processedActions$: Observable<ProcessedAction<S>> = this.processedActionsSubject;

    protected readonly commands: CommandsMethods<M>;

    constructor(readonly mountPoint: MountPoint<any, S>) {
        this.fassadeId = createUniqueFassadeId(this.getName().replace(" ", "_"));
        this.enrichInstanceMethods();

        const commands = this.createCommands();
        failIfInstanceMembersExistExceptState(commands);
        this.commands = this.createCommandsProxy(commands);
        tyduxStoreReducerList.push(this.createReducerFromCommands(commands));
        delete (this.commands as any).state;

        this.reduxStoreStateSubject.next(mountPoint.getState());
        mountPoint.subscribe(() => {
            this.reduxStoreStateSubject.next(mountPoint.getState());
        });
    }

    getName() {
        return "UnnamedFassade";
    }

    abstract createCommands(): M;

    get state(): Readonly<S> {
        return this.mountPoint.getState();
    }

    /**
     * Completes all observables returned by this store. Once this method gets called,
     * dispatched actions won't have an effect.
     */
    destroy(): void {
        // this.destroyed = true;
        // this.storeConnector.stateChangesSubject.complete();
        // this.processedActionsSubject.complete();
    }

    /**
     * Delegate to Store#destroy() for Angular.
     */
    ngOnDestroy(): void {
        this.destroy();
    }

    // hasUndeliveredProcessedActions() {
    //     return this._undeliveredProcessedActionsCount !== 0;
    // }

    select(): ObservableSelection<Readonly<S>>;

    select<R>(selector?: (state: Readonly<S>) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.reduxStoreStateSubject, selector);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.reduxStoreStateSubject, selector);
    }

    private enrichInstanceMethods() {
        const methodNamesUntilStoreParent: string[] = [];
        let level: any = this;
        while (level instanceof Fassade) {
            methodNamesUntilStoreParent.push(...functions(level));
            level = Object.getPrototypeOf(level);
        }

        for (let fnMemberName of methodNamesUntilStoreParent) {
            this.enrichInstanceMethod(fnMemberName);
        }
    }

    private enrichInstanceMethod(name: string) {
        const self = this;
        let member = (this as any)[name];
        Object.getPrototypeOf(this)[name] = function () {
            self.commandContextCallstack.push(name);
            try {
                const result = member.apply(this, arguments);
                if (result instanceof Promise) {
                    return new Promise(resolve => {
                        self.commandContextCallstack.push(name);
                        resolve(result);
                    }).then(value => {
                        self.commandContextCallstack.pop();
                        return value;
                    });
                } else {
                    return result;
                }
            } finally {
                self.commandContextCallstack.pop();
            }
        };
    }

    private createCommandsProxy(mutatorInstance: any): any {
        const proxyObj = {} as any;
        for (let mutatorMethodName of functionsIn(mutatorInstance)) {
            const self = this;
            proxyObj[mutatorMethodName] = function () {
                const storeMethodName = self.commandContextCallstack[self.commandContextCallstack.length - 1];
                const actionType = `${self.fassadeId} / ${mutatorMethodName}`;
                const args = Array.prototype.slice.call(arguments);
                const mutatorAction: FassadeAction = {type: actionType, payload: args, debugContext: storeMethodName};
                self.mountPoint.dispatch(mutatorAction);
            };
        }

        return proxyObj;
    }

    private createReducerFromCommands(commands: any): CommandReducer<S> {
        const mutatorReducer = createReducerFromCommands<S>(this.fassadeId, commands);

        return (state: any, action: FassadeAction) => {
            const preLocalState = createProxy(this.mountPoint.extractState(state));

            if (this.destroyed || !this.isActionForThisFassade(action)) {
                return state;
            }

            // const action = this.createActionWithoutStoreIdInType(action);
            // if (action !== null) {
            const postLocalState = mutatorReducer(preLocalState, action);
            state = this.mountPoint.setState(state, postLocalState);
            // }

            return state;
        };
    }

    private isActionForThisFassade(action: Action) {
        if (typeof action.type !== "string") {
            return;
        }

        return action.type.indexOf(`${this.fassadeId} / `) === 0;
    }

}
