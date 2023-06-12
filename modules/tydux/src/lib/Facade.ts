import {isNotNil, skipNil} from "@w11k/rx-ninja";
import {immerable} from "immer";
import {Action, Unsubscribe} from "redux";
import {Observable, ReplaySubject, Subject} from "rxjs";
import {take} from "rxjs/operators";
import {
    CommandReducer,
    Commands,
    CommandsInvoker,
    CommandsMethods,
    CommandsState,
    createReducerFromCommandsInvoker,
    FacadeAction
} from "./commands";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {deregisterFacadeCommands, registerFacadeCommands} from "./global-facade-registry";
import {MountPoint, NamedMountPoint} from "./store";
import {getGlobalStore} from "./store-global";
import {functionNamesDeep, functionNamesShallow, selectToObservable} from "./utils";

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
export abstract class Facade<C extends Commands<S>, S = CommandsState<C>> {

    readonly facadeId: string;

    protected readonly commands: CommandsMethods<C>;

    private readonly destroyedSubject = new ReplaySubject<true>(1);

    private destroyedState = false;

    private bufferedStateChanges = 0;

    private readonly reduxStoreStateSubject: Subject<S> = new ReplaySubject<S>(1);

    private readonly mountPointSubscription: Unsubscribe;

    private mountPoint: MountPoint<S>;

    private _state!: S;

    get state(): Readonly<S> {
        return this._state;
    }

    constructor(mountPointOrName: NamedMountPoint<S> | string,
                commands: C,
                initialState: InitialStateValue<S> | undefined) {

        if (typeof mountPointOrName === "string") {
            this.facadeId = mountPointOrName;
            this.mountPoint = getGlobalStore().createDeepMountPoint(mountPointOrName);
        } else {
            this.facadeId = mountPointOrName.sliceName;
            this.mountPoint = mountPointOrName;
        }

        this.mountPoint.destroySubject
            .pipe(take(1))
            .subscribe(() => this.destroy());

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

            // Determine the initial value. Separate logic for promises and non-promises so that
            // facades with a non-promise initial value are initialized synchronously.
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

        this.moveMethodsFromPrototypeToInstance();
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

    isDestroyed() {
        return this.destroyedState;
    }

    hasBufferedStateChanges() {
        return this.bufferedStateChanges > 0;
    }

    /**
     * Returns an observable which fires an event when the state changes.
     */
    select(): Observable<Readonly<S>>;

    /**
     * Returns an observable which fires an event when the selected (sub-)state changes.
     * - operates on the micro-task queue
     * - only emits values when they change (identity-based)
     *
     * @param selector projection function that maps a read-only copy of the new state to a subset of the new state
     */
    select<R>(selector?: (state: Readonly<S>) => R): Observable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R> {
        return selectToObservable(this.reduxStoreStateSubject, selector);
    }

    /**
     * - operates on the micro-task queue
     * - only emits values when they change (identity-based)
     * - only emits nonNil values (null or undefined)
     */
    selectNonNil<R>(selector?: (state: Readonly<S>) => R | null | undefined): Observable<R> {
        return selectToObservable(this.reduxStoreStateSubject, selector)
            .pipe(skipNil());
    }

    createActionName(mutatorMethodName: string) {
        return `[${this.facadeId}] ${mutatorMethodName}`;
    }

    createMountPoint<P extends keyof S>(slice: P): NamedMountPoint<S[P], S> {
        const mountPoint = this.mountPoint.tyduxStore.createDeepMountPoint(this.facadeId + "." + String(slice));
        this.observeDestroyed()
            .pipe(take(1))
            .subscribe(() => mountPoint.destroySubject.next());
        return mountPoint;
    }

    private setState(state: S) {
        if (isNotNil(state) && ![Array, Map, Set, Object].includes((state as any).constructor)) {
            (state as any).constructor[immerable] = true;
        }
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state as any) as any : state;
    }

    private moveMethodsFromPrototypeToInstance() {
        const methodNamesUntilStoreParent: string[] = [];
        let level: any = this;
        while (level instanceof Facade) {
            methodNamesUntilStoreParent.push(...functionNamesShallow(level));
            level = Object.getPrototypeOf(level);
        }

        const self = this;
        for (const fnMemberName of methodNamesUntilStoreParent) {
            const method = (this as any)[fnMemberName];
            (this as any)[fnMemberName] = function () {
                return method.apply(self, arguments);
            };
        }
    }

    private createCommandsProxy(commandsInvoker: CommandsInvoker<C>): C {
        const proxyObj = {} as any;
        // const protoOfCommandsInstance = Object.getPrototypeOf(commandsInvoker.commands);

        for (const mutatorMethodName of functionNamesDeep(commandsInvoker.commands)) {
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
            const preLocalState = this.mountPoint.extractState(state);

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
