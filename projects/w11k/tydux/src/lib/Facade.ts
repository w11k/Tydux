import {Action} from "redux";
import {Observable, ReplaySubject, Subject} from "rxjs";
import {
    CommandReducer,
    Commands,
    CommandsInvoker,
    CommandsMethods,
    createReducerFromCommandsInvoker,
    FacadeAction
} from "./commands";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {MountPoint, TyduxStore} from "./store";
import {createProxy, functions, functionsIn, selectToObservable} from "./utils";

const uniqueFacadeIds: { [id: string]: number } = {};

function createUniqueFacadeId(name: string) {
    if (uniqueFacadeIds[name] === undefined) {
        uniqueFacadeIds[name] = 1;
    } else {
        uniqueFacadeIds[name] += 1;
    }

    const count = uniqueFacadeIds[name];
    if (count === 1) {
        return name;
    } else {
        return `${name}(${count})`;
    }
}

export abstract class Facade<S, C extends Commands<S>> {

    readonly facadeId: string;

    protected readonly commands: CommandsMethods<C>;

    private readonly destroyedSubject = new ReplaySubject<true>(1);

    protected readonly destroyed = this.destroyedSubject.asObservable();

    private destroyedState = false;

    private bufferedStateChanges = 0;

    private readonly commandContextCallstack: string[] = [];

    private readonly reduxStoreStateSubject: Subject<S> = new ReplaySubject<S>(1);

    private mountPoint: MountPoint<S, any>;

    private _state!: S;

    get state(): Readonly<S> {
        return this._state;
    }

    constructor(mountPoint: MountPoint<S, any>, name: string, commands: C);

    constructor(tydux: TyduxStore, name: string, commands: C, initialState: S);

    constructor(mountPoint: MountPoint<S | undefined, any>, name: string, commands: C, initialState: S);

    constructor(readonly mountPointOrRootStore: MountPoint<S, any> | TyduxStore,
                name: string,
                commands: C,
                initialState?: S) {

        this.facadeId = createUniqueFacadeId(name.replace(" ", "_"));
        this.enrichInstanceMethods();

        this.mountPoint =
            mountPointOrRootStore instanceof TyduxStore
                ? mountPointOrRootStore.createRootMountPoint(name)
                : mountPointOrRootStore;

        const [commandsInvoker, proxyObj] = this.createCommandsProxy(commands);
        this.commands = proxyObj;

        this.mountPoint.addReducer(this.createReducerFromCommandsInvoker(commandsInvoker));
        delete (this.commands as any).state;

        this.setState(this.mountPoint.getState());
        this.reduxStoreStateSubject.next(this.state);

        if (initialState !== undefined) {
            const initialFacadeStateAction = this.facadeId + "@@INIT";

            this.mountPoint.addReducer((state: S, action: Action) => {
                if (action.type === initialFacadeStateAction) {
                    this.setState(initialState);
                    this.reduxStoreStateSubject.next(this.state);
                    return this.mountPoint.setState(state, initialState);
                }

                return state;
            });

            this.mountPoint.dispatch({type: initialFacadeStateAction, initialFacadeState: initialState});
        }

        this.mountPoint.subscribe(() => {
            const currentState = Object.assign({}, this.mountPoint.getState());
            this.bufferedStateChanges++;
            this.setState(currentState);

            // trigger micro task to ease reentrant code
            Promise.resolve().then(() => {
                this.bufferedStateChanges--;
                this.reduxStoreStateSubject.next(currentState);
            });
        });
    }

    /**
     * Completes all observables returned by this store. Once this method gets called,
     * dispatched actions won't have an effect.
     */
    destroy(): void {
        this.destroyedState = true;
        this.reduxStoreStateSubject.complete();
        this.destroyedSubject.next(true);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Delegate to Store#destroy() for Angular.
     */
    // tslint:disable-next-line:use-life-cycle-interface
    ngOnDestroy(): void {
        this.destroy();
    }

    hasBufferedStateChanges() {
        return this.bufferedStateChanges > 0;
    }

    select(): Observable<Readonly<S>>;

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R>;

    /**
     * - operates on the micro-task queue
     * - only emits values when they change (identity-based)
     */
    select<R>(selector?: (state: Readonly<S>) => R): Observable<R> {
        return selectToObservable(this.reduxStoreStateSubject, selector);
    }

    private setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

    private enrichInstanceMethods() {
        const methodNamesUntilStoreParent: string[] = [];
        let level: any = this;
        while (level instanceof Facade) {
            methodNamesUntilStoreParent.push(...functions(level));
            level = Object.getPrototypeOf(level);
        }

        for (const fnMemberName of methodNamesUntilStoreParent) {
            this.enrichInstanceMethod(fnMemberName);
        }
    }

    private enrichInstanceMethod(name: string) {
        const self = this;
        const member = (this as any)[name];
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

    private createCommandsProxy(commands: C): [CommandsInvoker<C>, C] {
        const commandsInvoker = new CommandsInvoker(commands);

        const proxyObj = {} as any;

        const protoOfCommandsInstance = Object.getPrototypeOf(commandsInvoker.commands);

        for (const mutatorMethodName of functionsIn(protoOfCommandsInstance)) {
            const self = this;
            proxyObj[mutatorMethodName] = function () {
                const storeMethodName = self.commandContextCallstack[self.commandContextCallstack.length - 1];
                const actionType = `[${self.facadeId}] ${mutatorMethodName}`;
                const args = Array.prototype.slice.call(arguments);
                const mutatorAction: FacadeAction = {type: actionType, payload: args, debugContext: storeMethodName};
                return self.mountPoint.dispatch(mutatorAction);
            };
        }

        return [commandsInvoker, proxyObj];
    }

    private createReducerFromCommandsInvoker(commandsInvoker: CommandsInvoker<C>): CommandReducer<S> {
        const mutatorReducer = createReducerFromCommandsInvoker<S>(this.facadeId, commandsInvoker);

        return (state: any, action: FacadeAction) => {
            const preLocalState = createProxy(this.mountPoint.extractState(state));

            if (this.destroyedState || !this.isActionForThisFacade(action)) {
                return state;
            }

            const postLocalState = mutatorReducer(preLocalState, action);
            state = this.mountPoint.setState(state, postLocalState);
            return state;
        };
    }

    private isActionForThisFacade(action: Action): boolean {
        if (typeof action.type !== "string") {
            return false;
        }

        return action.type.indexOf(`[${this.facadeId}] `) === 0;
    }

}
