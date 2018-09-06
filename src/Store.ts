import {Observable, ReplaySubject} from "rxjs";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {mutatorHasInstanceMembers} from "./error-messages";
import {registerStoreInGlobalState} from "./global-state";
import {Middleware, MiddlewareInit} from "./middleware";
import {createReducerFromMutator, Mutator, MutatorAction, MutatorDispatcher, MutatorMethods} from "./mutator";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {createProxy, functions, functionsIn} from "./utils";


export class ProcessedAction<S> {
    constructor(readonly storeId: string,
                readonly context: string | null | undefined,
                readonly mutatorAction: MutatorAction,
                readonly state: S,
                public duration?: number) {
    }
}

export function failIfInstanceMembersExistExceptState(obj: any) {
    const members = Object.keys(obj).filter(key => key !== "state");
    if (members.length > 0) {
        throw new Error(mutatorHasInstanceMembers + ": " + members.join(","));
    }
}

export class StoreConnector<S> {

    private _state: S = undefined as any;

    readonly stateChangesSubject = new ReplaySubject<S>(1);

    constructor(readonly storeId: string) {
    }

    get state(): Readonly<S> {
        return this._state;
    }

    setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

}

export class Store<M extends Mutator<S>, S> {

    private destroyed = false;

    private readonly storeConnector: StoreConnector<S>;

    private readonly middleware: Middleware<S, Mutator<S>, this>[] = [];

    private _undeliveredProcessedActionsCount = 0;

    private readonly mutatorContextCallstack: string[] = [];

    private readonly processedActionsSubject = new ReplaySubject<ProcessedAction<S>>(1);

    readonly processedActions$: Observable<ProcessedAction<S>> = this.processedActionsSubject;

    private readonly mutatorDispatcher: MutatorDispatcher;

    protected readonly mutate: MutatorMethods<M>;

    constructor(readonly storeId: string,
                mutatorInstance: Mutator<S>,
                readonly initialState: S,
                storeConnector?: StoreConnector<S>) {

        const topLevelStore = storeConnector === undefined;
        this.storeConnector = storeConnector === undefined ? new StoreConnector<S>(storeId) : storeConnector;

        this.enrichInstanceMethods();
        failIfInstanceMembersExistExceptState(mutatorInstance);

        this.mutatorDispatcher = this.createMutatorDispatcher(mutatorInstance);
        this.mutate = this.createMutatorProxy(mutatorInstance);


        delete (this.mutate as any).state;

        registerStoreInGlobalState(
            this.storeConnector.storeId,
            topLevelStore,
            this,
            state => {
                this.storeConnector.setState(state);
                this.storeConnector.stateChangesSubject.next(state);
            });

        this.processDispatchedMutatorAction(null, {type: "@@INIT", arguments: [initialState]}, initialState);
    }

    get state(): Readonly<S> {
        return this.storeConnector.state;
    }

    /**
     * Completes all observables returned by this store. Once this method gets called,
     * dispatched actions won't have an effect.
     */
    destroy(): void {
        this.destroyed = true;
        this.storeConnector.stateChangesSubject.complete();
        this.processedActionsSubject.complete();
    }

    /**
     * Delegate to Store#destroy() for Angular.
     */
    ngOnDestroy(): void {
        this.destroy();
    }

    hasUndeliveredProcessedActions() {
        return this._undeliveredProcessedActionsCount !== 0;
    }

    select(): ObservableSelection<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): ObservableSelection<R>;

    select<R>(selector?: (state: Readonly<S>) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.storeConnector.stateChangesSubject, selector);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.storeConnector.stateChangesSubject, selector);
    }

    installMiddleware(middleware: Middleware<S, Mutator<S>, this>) {
        let mutator = middleware.getMutator();

        let middlewareCounter = this.middleware.length;
        const middlewareStore = new Store(
            this.storeId + `_${middlewareCounter}-${middleware.getName()}`,
            mutator,
            this.state,
            this.storeConnector
        );

        const mutatorDispatcher: MutatorDispatcher = (action: MutatorAction) => {
            try {
                this.mutatorContextCallstack.push("|" + middlewareCounter + "-" + middleware.getName());
                this.mutatorDispatcher(action);
            } finally {
                this.mutatorContextCallstack.pop();
            }
        };

        middleware.initMiddleware(new MiddlewareInit(this.storeConnector, mutatorDispatcher));

        middleware.mutate = middlewareStore.mutate;
        this.middleware.push(middleware);

        return middlewareStore;
    }

    private enrichInstanceMethods() {
        const methodNamesUntilStoreParent: string[] = [];
        let level = this;
        while (level instanceof Store) {
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
            self.mutatorContextCallstack.push("#" + name);
            try {
                const result = member.apply(this, arguments);
                if (result instanceof Promise) {
                    return new Promise(resolve => {
                        self.mutatorContextCallstack.push(name);
                        resolve(result);
                    }).then(value => {
                        self.mutatorContextCallstack.pop();
                        return value;
                    });
                } else {
                    return result;
                }
            } finally {
                self.mutatorContextCallstack.pop();
            }
        };
    }

    private processDispatchedMutatorAction(context: string | null | undefined,
                                           mutatorAction: MutatorAction,
                                           newState: S,
                                           duration?: number) {

        this.storeConnector.setState(newState);

        const processedAction = new ProcessedAction(
            this.storeId,
            context,
            mutatorAction,
            newState,
            duration
        );

        // async delivery to avoid re-entrant problems
        // https://github.com/ReactiveX/rxjs/issues/2155
        this._undeliveredProcessedActionsCount++;
        setTimeout(() => {
            this._undeliveredProcessedActionsCount--;
            this.storeConnector.stateChangesSubject.next(newState);
            this.processedActionsSubject.next(processedAction);
        }, 0);

        this.middleware.forEach(m => m.afterActionProcessed(processedAction));
    }

    private createMutatorProxy(mutatorInstance: any): any {
        const proxyObj = {} as any;
        for (let mutatorMethodName of functionsIn(mutatorInstance)) {
            const self = this;
            proxyObj[mutatorMethodName] = function () {
                const args = Array.prototype.slice.call(arguments);
                const mutatorAction: MutatorAction = {type: mutatorMethodName, arguments: args};
                self.mutatorDispatcher(mutatorAction);
            };
        }

        return proxyObj;
    }

    private createMutatorDispatcher(mutatorInstance: any): MutatorDispatcher {
        const mutatorReducer = createReducerFromMutator(mutatorInstance);

        return (mutatorAction: MutatorAction) => {
            if (this.destroyed) {
                return;
            }

            let tyduxDevelopmentModeEnabled = isTyduxDevelopmentModeEnabled();
            const stateProxy = createProxy(this.state);
            const start = tyduxDevelopmentModeEnabled ? Date.now() : 0;

            for (let m of this.middleware) {
                const result = m.beforeActionDispatch(stateProxy, mutatorAction);
                if (result === false) {
                    return;
                }
            }

            const newState = mutatorReducer(stateProxy, mutatorAction);

            const storeMethodName = this.mutatorContextCallstack[this.mutatorContextCallstack.length - 1];
            const duration = tyduxDevelopmentModeEnabled ? Date.now() - start : undefined;

            this.processDispatchedMutatorAction(
                storeMethodName,
                mutatorAction,
                newState as S,
                duration
            );
        };
    }

}






