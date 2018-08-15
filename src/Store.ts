import * as _ from "lodash";
import {Observable, ReplaySubject} from "rxjs";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {mutatorHasInstanceMembers} from "./error-messages";
import {registerStore} from "./global-state";
import {createReducerFromMutator, Mutator} from "./mutator";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {createProxy} from "./utils";
import {Middleware, MiddlewareInit} from "./middleware";

export interface Action {
    [param: string]: any;

    type: string;
}

export class ProcessedAction<S> {
    constructor(readonly storeId: string,
                readonly action: Action,
                readonly state: S,
                public duration?: number) {
    }
}

export function failIfInstanceMembersExistExceptState(obj: any) {
    let members = _.difference(_.keys(obj), ["state"]);
    if (members.length > 0) {
        throw new Error(mutatorHasInstanceMembers + ": " + members.join(","));
    }
}

export function createActionFromArguments(actionTypeName: string, fn: any, args: IArguments): Action {
    const fnString = fn.toString();
    const argsString = fnString.substring(fnString.indexOf("(") + 1, fnString.indexOf(")"));
    const argNames = argsString.split(",").map((a: string) => a.trim());

    const action: any = {};
    for (let i = 0; i < args.length; i++) {
        const arg = "[" + i + "] " + argNames[i];
        action[arg] = args[i];
    }
    action.type = actionTypeName;

    return action;
}

export abstract class Store<M extends Mutator<S>, S> {

    private readonly middleware: Middleware<S>[];

    private readonly stateChangesSubject = new ReplaySubject<S>(1);

    private _state: S = undefined as any;

    private _undeliveredProcessedActionsCount = 0;

    private readonly memberMethodCallstack: string[] = [];

    private readonly processedActionsSubject = new ReplaySubject<ProcessedAction<S>>(1);

    readonly processedActions$: Observable<ProcessedAction<S>> = this.processedActionsSubject;

    protected readonly mutate: M;

    constructor(readonly storeId: string,
                mutatorInstance: Mutator<S>,
                readonly initialState: S,
                // middlewareInitFns: MiddlewareInit<Store<any, S>, S>[] = []
    ) {

        this.enrichInstanceMethods();
        failIfInstanceMembersExistExceptState(mutatorInstance);
        this.mutate = this.createMutatorProxy(mutatorInstance);
        delete (this.mutate as any).state;

        registerStore(this, state => {
            this.setState(state);
            this.stateChangesSubject.next(state);
        });

        this.processDispatchedAction({type: "@@INIT"}, initialState);

        this.middleware = this.initMiddleware([]);
    }

    public getMiddlewareInitFunctions(): MiddlewareInit<this, S>[] {
        return [];
    }

    private initMiddleware(middlewareInitFns: MiddlewareInit<this, S>[]): Middleware<S>[] {
        // const setStateFn = (action: Action, state: S) => {
        //     this.processDispatchedAction(action, state);
        // };
        return middlewareInitFns.map(m => m(this));
    }

    get state(): Readonly<S> {
        return this._state;
    }

    hasUndeliveredProcessedActions() {
        return this._undeliveredProcessedActionsCount !== 0;
    }

    select(): ObservableSelection<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): ObservableSelection<R>;

    select<R>(selector?: (state: Readonly<S>) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.stateChangesSubject, selector);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.stateChangesSubject, selector);
    }

    private enrichInstanceMethods() {
        const methodNamesUntilStoreParent: string[] = [];
        let level = this;
        while (level instanceof Store) {
            methodNamesUntilStoreParent.push(..._.functions(level));
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
            self.memberMethodCallstack.push(name);
            try {
                const result = member.apply(this, arguments);
                if (result instanceof Promise) {
                    return new Promise(resolve => {
                        self.memberMethodCallstack.push(name);
                        resolve(result);
                    }).then(value => {
                        self.memberMethodCallstack.pop();
                        return value;
                    });
                } else {
                    return result;
                }
            } finally {
                self.memberMethodCallstack.pop();
            }
        };
    }

    private processDispatchedAction(action: Action, newState: S, duration?: number) {
        this.setState(newState);

        const processedAction = new ProcessedAction(
            this.storeId,
            action,
            newState,
            duration
        );

        // async delivery to avoid re-entrant problems
        // https://github.com/ReactiveX/rxjs/issues/2155
        this._undeliveredProcessedActionsCount++;
        setTimeout(() => {
            this._undeliveredProcessedActionsCount--;
            this.stateChangesSubject.next(newState);
            this.processedActionsSubject.next(processedAction);
        }, 0);
    }

    private setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

    private createMutatorProxy(mutatorInstance: any): M {
        const reducer = createReducerFromMutator(mutatorInstance);
        const proxyObj = {} as any;
        for (let mutatorMethodName of _.functionsIn(mutatorInstance)) {
            const mutatorFn = mutatorInstance[mutatorMethodName];
            const self = this;

            let tyduxDevelopmentModeEnabled = isTyduxDevelopmentModeEnabled();
            proxyObj[mutatorMethodName] = function () {
                const args = arguments as any;
                const stateProxy = createProxy(self.state);

                const start = tyduxDevelopmentModeEnabled ? Date.now() : 0;

                let action = {type: mutatorMethodName, payload: args};
                for (let m of self.middleware) {
                    const newAction = m.beforeActionDispatch(stateProxy, action);
                    if (newAction != null) {
                        action = newAction;
                    }
                }

                const newState = reducer(stateProxy, action);

                let storeMethodName = self.memberMethodCallstack[self.memberMethodCallstack.length - 1];
                storeMethodName = _.isNil(storeMethodName) ? "" : "#" + storeMethodName;
                const actionType = self.storeId + storeMethodName + " / " + mutatorMethodName;

                // const mutatorEvent = new ProcessedAction(
                //     self.storeId,
                //     createActionFromArguments(actionType, mutatorFn, args),
                //     newState as S
                // );

                const duration = tyduxDevelopmentModeEnabled ? Date.now() - start : undefined;

                self.processDispatchedAction(
                    createActionFromArguments(actionType, mutatorFn, args),
                    newState as S,
                    duration
                );
            };
        }

        return proxyObj;
    }

}
