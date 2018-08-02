import * as _ from "lodash";
import {Observable, ReplaySubject} from "rxjs";
import {map} from "rxjs/operators";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {mutatorHasInstanceMembers} from "./error-messages";
import {addStoreToGlobalState} from "./global-state";
import {Mutator} from "./mutator";
import {
    ObservableSelection,
    selectNonNilToObervableSelection,
    selectToObservableSelection
} from "./ObservableSelection";
import {createFailingProxy, createProxy, failIfNotUndefined} from "./utils";

export interface Action {
    [param: string]: any;

    type: string;
}

export class MutatorEvent<S> {
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

    private _state: S = undefined as any;

    private mutatorCallStackCount = 0;

    private readonly mutatorEventsSubject = new ReplaySubject<MutatorEvent<S>>(1);

    private _undispatchedMutatorEventsCount = 0;

    private readonly memberMethodCallstack: string[] = [];

    protected readonly mutate: M;

    readonly mutatorEvents$: Observable<MutatorEvent<S>> = this.mutatorEventsSubject;

    constructor(readonly storeId: string,
                mutatorInstance: Mutator<S>,
                state: S) {

        this.processMutator(new MutatorEvent(
            this.storeId,
            {type: "@@INIT"},
            state
        ));

        failIfInstanceMembersExistExceptState(mutatorInstance);

        this.mutate = this.createMutatorProxy(mutatorInstance);
        delete (this.mutate as any).state;

        this.enrichInstanceMethods();

        addStoreToGlobalState(this);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    hasUndispatchedMutatorEvents() {
        return this._undispatchedMutatorEventsCount !== 0;
    }

    select(): ObservableSelection<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): ObservableSelection<R>;

    select<R>(selector?: (state: Readonly<S>) => R): ObservableSelection<R> {
        return selectToObservableSelection(this.mutatorEvents$.pipe(map(e => e.state)), selector);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): ObservableSelection<R> {
        return selectNonNilToObervableSelection(this.mutatorEvents$.pipe(map(e => e.state)), selector);
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

    private processMutator(mutatorEvent: MutatorEvent<S>) {
        this.setState(mutatorEvent.state);

        // async delivery to avoid re-entrant problems
        // https://github.com/ReactiveX/rxjs/issues/2155
        this._undispatchedMutatorEventsCount++;
        setTimeout(() => {
            this._undispatchedMutatorEventsCount--;
            this.mutatorEventsSubject.next(mutatorEvent);
        }, 0);
    }

    private setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

    private mutateState(fn: (state: S, isRootCall: boolean) => MutatorEvent<S>): void {
        let tyduxDevelopmentModeEnabled = isTyduxDevelopmentModeEnabled();

        const isRoot = this.mutatorCallStackCount === 0;
        this.mutatorCallStackCount++;

        let mutatorEvent: MutatorEvent<S>;
        try {
            const stateProxy = createProxy(this.state);

            const start = tyduxDevelopmentModeEnabled ? Date.now() : 0;
            mutatorEvent = fn(stateProxy, isRoot);

            if (tyduxDevelopmentModeEnabled) {
                mutatorEvent.duration = Date.now() - start;
            }
        } finally {
            this.mutatorCallStackCount--;
        }

        if (isRoot) {
            this.processMutator(mutatorEvent);
        }
    }

    private createMutatorProxy(mutatorsInstance: any): M {
        const proxyObj = {} as any;
        const proxyProto = {} as any;
        Object.setPrototypeOf(proxyObj, proxyProto);

        for (let mutatorName of _.functionsIn(mutatorsInstance)) {
            const mutatorFn = mutatorsInstance[mutatorName];
            const self = this;

            proxyProto[mutatorName] = function () {
                Object.setPrototypeOf(proxyProto, {});

                const args = arguments;
                let result: any = undefined;

                self.mutateState((oldState, isRootCall) => {
                    // call mutator
                    let thisObj = this;
                    if (isRootCall) {
                        proxyObj.state = oldState;
                        const tempThisObj = {};
                        Object.setPrototypeOf(tempThisObj, proxyObj);
                        thisObj = tempThisObj;
                    }

                    result = mutatorFn.apply(thisObj, args);
                    failIfNotUndefined(result);
                    failIfInstanceMembersExistExceptState(thisObj);
                    proxyObj.state = thisObj.state;

                    let storeMethodName = self.memberMethodCallstack[self.memberMethodCallstack.length - 1];
                    storeMethodName = _.isNil(storeMethodName) ? "" : "#" + storeMethodName;
                    const actionType = self.storeId + storeMethodName + " / " + mutatorName;

                    const mutatorEvent = new MutatorEvent(
                        self.storeId,
                        createActionFromArguments(actionType, mutatorFn, args),
                        proxyObj.state
                    );

                    if (isRootCall) {
                        Object.setPrototypeOf(thisObj, createFailingProxy());
                    }

                    return mutatorEvent;
                });

                return result;
            };
        }

        return proxyObj;
    }

}
