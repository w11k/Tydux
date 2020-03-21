import {Action, Unsubscribe} from "redux";
import {Observable, ReplaySubject, Subject} from "rxjs";
import {CommandReducer, Commands, CommandsInvoker, CommandsMethods, createReducerFromCommandsInvoker, FacadeAction} from "./commands";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {deregisterFacadeCommands, registerFacadeCommands} from "./global-facade-registry";
import {MountPoint, NamedMountPoint} from "./store";
import {getGlobalStore} from "./store-global";
import {createProxy, functionNamesDeep, selectToObservable} from "./utils";

// const uniqueFacadeIds: { [id: string]: number } = {};

// function createUniqueFacadeId(name: string) {
//     if (uniqueFacadeIds[name] === undefined) {
//         uniqueFacadeIds[name] = 1;
//     } else {
//         uniqueFacadeIds[name] += 1;
//     }
//
//     const count = uniqueFacadeIds[name];
//     if (count === 1) {
//         return name;
//     } else {
//         return `${name}(${count})`;
//     }
// }

/**
 * One of:
 * - a value of type S
 * - a noarg-function that returns the value of type S
 * - a promise that resolves the value of type S
 */
export type InitialStateValue<S> = S | (() => S) | Promise<S>;

/**
 * Tydux Facade
 */
export abstract class Facade<S, C extends Commands<S>> {

    readonly facadeId: string;

    protected readonly commands: CommandsMethods<C>;

    private readonly destroyedSubject = new ReplaySubject<true>(1);

    // noinspection JSUnusedGlobalSymbols
    /**
     * @deprecated use Facade#observeDestroyed()
     */
    protected readonly destroyed = this.destroyedSubject.asObservable();

    private destroyedState = false;

    private bufferedStateChanges = 0;

    private readonly reduxStoreStateSubject: Subject<S> = new ReplaySubject<S>(1);

    private readonly mountPointSubscription: Unsubscribe;

    private mountPoint: MountPoint<S>;

    private _state!: S;

    get state(): Readonly<S> {
        return this._state;
    }

    constructor(mountPointName: string,
                initialState: InitialStateValue<S> | undefined,
                commands: C);

    constructor(mountPoint: NamedMountPoint<S>,
                initialState: InitialStateValue<S> | undefined,
                commands: C);

    /**
     * @deprecated since 13.0.0
     */
    constructor(mountPointName: string,
                commands: C,
                initialState: InitialStateValue<S> | undefined);

    /**
     * @deprecated since 13.0.0
     */
    constructor(mountPoint: NamedMountPoint<S>,
                commands: C,
                initialState: InitialStateValue<S> | undefined);

    constructor(mountPointOrName: NamedMountPoint<S> | string,
                initialStateOrCommands1: (InitialStateValue<S> | undefined) | C,
                initialStateOrCommands2: (InitialStateValue<S> | undefined) | C) {

        let commands: C;
        let initialState: InitialStateValue<S> | undefined;
        if (initialStateOrCommands1 instanceof Commands) {
            commands = initialStateOrCommands1;
            initialState = initialStateOrCommands2 as any;
        } else {
            commands = initialStateOrCommands2 as any;
            initialState = initialStateOrCommands1;
        }


        if (typeof mountPointOrName === "string") {
            this.facadeId = mountPointOrName;
            this.mountPoint = getGlobalStore().createDeepMountPoint(mountPointOrName);
        } else {
            this.facadeId = mountPointOrName.sliceName;
            this.mountPoint = mountPointOrName;
        }

        registerFacadeCommands(this.facadeId, commands);

        const commandsInvoker = new CommandsInvoker(commands);
        this.commands = this.createCommandsProxy(commandsInvoker);
        this.mountPoint.addReducer(this.createReducerFromCommandsInvoker(commandsInvoker));

        this.setState(this.mountPoint.getState());
        this.reduxStoreStateSubject.next(this.state);

        if (initialState !== undefined) {
            const initialFacadeStateAction = this.createActionName("@@SET_STATE");

            this.mountPoint.addReducer((state: S, action: Action) => {
                if (action.type === initialFacadeStateAction) {
                    const stateValue = (action as any).initialState;
                    this.setState(stateValue);
                    this.reduxStoreStateSubject.next(this.state);
                    return this.mountPoint.setState(state, stateValue);
                }

                return state;
            });

            // Determine the initial value. Seperate logic for promises and non-promises so that
            // facades with an non-promise initial value are initialized synchronously.
            if (initialState instanceof Promise) {
                this.bufferedStateChanges++;
                initialState
                    .then(value => {
                        this.mountPoint.dispatch({type: initialFacadeStateAction, initialState: value});
                    })
                    .finally(() => this.bufferedStateChanges--);
            } else {
                const initialStateValue: S = initialState instanceof Function
                    ? initialState()
                    : initialState;
                this.mountPoint.dispatch({
                    type: initialFacadeStateAction,
                    initialState: initialStateValue
                });
            }
        }

        this.mountPointSubscription = this.mountPoint.subscribe(() => {
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
        this.mountPointSubscription();
        this.mountPoint.freeSlicePath();
        this.destroyedState = true;
        this.reduxStoreStateSubject.complete();
        this.destroyedSubject.next(true);
        deregisterFacadeCommands(this.facadeId);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Delegate to Store#destroy() for Angular.
     */
    // tslint:disable-next-line:use-life-cycle-interface use-lifecycle-interface
    ngOnDestroy(): void {
        this.destroy();
    }

    observeDestroyed() {
        return this.destroyedSubject.asObservable();
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

    createActionName(mutatorMethodName: string) {
        return `[${this.facadeId}] ${mutatorMethodName}`;
    }

    private setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

    // private enrichInstanceMethods() {
    // const methodNamesUntilStoreParent: string[] = [];
    // let level: any = this;
    // while (level instanceof Facade) {
    // methodNamesUntilStoreParent.push(...functionNamesShallow(level));
    // level = Object.getPrototypeOf(level);
    // }

    // for (const fnMemberName of methodNamesUntilStoreParent) {
    //     this.enrichInstanceMethod(fnMemberName);
    // }
    // }

    // private enrichInstanceMethod(name: string) {
    //     const member = (this as any)[name];
    //     Object.getPrototypeOf(this)[name] = function () {
    //         try {
    //             const result = member.apply(this, arguments);
    //             if (result instanceof Promise) {
    //                 return new Promise(resolve => {
    //                     resolve(result);
    //                 }).then(value => {
    //                     return value;
    //                 });
    //             } else {
    //                 return result;
    //             }
    //         } finally {
    //         }
    //     };
    // }

    private createCommandsProxy(commandsInvoker: CommandsInvoker<C>): C {
        const proxyObj = {} as any;
        const protoOfCommandsInstance = Object.getPrototypeOf(commandsInvoker.commands);

        for (const mutatorMethodName of functionNamesDeep(protoOfCommandsInstance)) {
            const self = this;
            proxyObj[mutatorMethodName] = function () {
                const actionType = self.createActionName(mutatorMethodName);
                const args = Array.prototype.slice.call(arguments);
                const mutatorAction: FacadeAction = {type: actionType, payload: args};
                return self.mountPoint.dispatch(mutatorAction);
            };
        }

        return proxyObj;
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
