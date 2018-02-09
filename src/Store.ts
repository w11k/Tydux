import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {addStoreToGlobalState, MutatorEvent} from "./global-state";
import {assignStateValue, createFailingProxy, createProxy, failIfNotUndefined, Mutators} from "./mutators";
import {UnboundedObservable} from "./UnboundedObservable";
import {isShallowEquals} from "./utils";

export interface Action {
    [param: string]: any;

    type: string;
}

interface StateChange<S> {
    state: S;
    mutatorEvent: MutatorEvent;
}

function createActionFromArguments(actionTypeName: string, fn: any, args: IArguments): Action {
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

export abstract class Store<M extends Mutators<S>, S> implements Store<M, S> {

    private _state: S = undefined as any;

    private stateChangesSubject = new ReplaySubject<StateChange<S>>(1);

    protected readonly mutate: M;

    readonly mutatorEvents$: Observable<MutatorEvent> = this.stateChangesSubject.pipe(
            map(stateChange => stateChange.mutatorEvent)
    );

    constructor(readonly storeName: string, mutators: M, state: S) {
        this.processMutator({type: `${storeName} # @@INIT`}, state, _.noop);

        this.mutate = mutators;
        this.instrumentMutators();
        this.wrapStoreMethods();

        addStoreToGlobalState(this);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    select<R>(): UnboundedObservable<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): UnboundedObservable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): UnboundedObservable<R> {
        const stream = this.stateChangesSubject.pipe(
                map(stateChange => {
                    return selector ? selector(stateChange.state) : stateChange.state as any;
                }),
                distinctUntilChanged((old, value) => {
                    if (_.isArray(old) && _.isArray(value)) {
                        return isShallowEquals(old, value);
                    } else {
                        return old === value;
                    }
                }));

        return new UnboundedObservable(stream);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined = _.identity as any): UnboundedObservable<R> {
        return new UnboundedObservable(
                this.select(selector).unbounded().pipe(
                        filter(val => !_.isNil(val)),
                        map(val => val!)
                ));
    }

    private processMutator(action: any, state: S, boundMutator: () => void) {
        this.setState(state);
        this.stateChangesSubject.next({
            mutatorEvent: new MutatorEvent(this.storeName, action, boundMutator),
            state: this._state
        });
    }

    private setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

    private wrapStoreMethods() {
        const memberMethodsThisCallStack: any[] = [this];

        const methods: string[] = _.functions(Object.getPrototypeOf(this));
        for (let methodName of methods) {

            const originalStoreMethod = (this as any)[methodName];
            (this as any)[methodName] = function () {

                const mutatorInstanceProxy = {
                    storeMethodName: methodName,
                };
                Object.setPrototypeOf(mutatorInstanceProxy, _.last(memberMethodsThisCallStack).mutate);

                const storeProxy = {
                    mutate: mutatorInstanceProxy
                };
                const parentThisInCallStack = _.last(memberMethodsThisCallStack);
                Object.setPrototypeOf(storeProxy, parentThisInCallStack);

                // new this on callstack
                memberMethodsThisCallStack.push(storeProxy);

                // cleanup after invocation (special treatment for promises below)
                const assignThisValuesToParentInCallStack = (currentThis: any, parentThis: any) => {
                    delete currentThis.mutate;
                    _.assignInWith(parentThis, currentThis);
                    memberMethodsThisCallStack.pop();
                };

                let result: any;
                let resultIsPromise = false;
                try {
                    result = originalStoreMethod.apply(storeProxy, arguments);
                    if (result instanceof Promise) {
                        resultIsPromise = true;
                        result = result.then((r) => {
                            assignThisValuesToParentInCallStack(storeProxy, parentThisInCallStack);
                            return r;
                        }).catch(() => {
                            assignThisValuesToParentInCallStack(storeProxy, parentThisInCallStack);
                        });
                    }
                } finally {
                    if (!resultIsPromise) {
                        assignThisValuesToParentInCallStack(storeProxy, parentThisInCallStack);
                    }
                }

                return result;
            };
        }
    }

    private instrumentMutators() {
        const this_ = this;
        const mutators = this.mutate as any;
        const mutatorCallStack: any[] = [mutators];

        for (let mutName of _.functions(Object.getPrototypeOf(mutators))) {
            const mutatorFn = mutators[mutName];
            mutators[mutName] = function () {
                const args = arguments;
                const isRootMutator = mutatorCallStack.length === 1;

                // create state copy
                if (isRootMutator) {
                    const stateProxy = createProxy(this_.state);
                    assignStateValue(mutators, stateProxy);
                }

                // call mutator
                let result: any;
                const mutatorsThisProxy = createProxy(mutators);
                mutatorCallStack.push(mutatorsThisProxy);
                try {
                    result = mutatorFn.apply(mutatorsThisProxy, args);
                } finally {
                    // transfer created/modified instance members
                    const parentMutatorInCallStack = mutatorCallStack[mutatorCallStack.length - 2];
                    delete mutatorsThisProxy.state;
                    _.assignIn(parentMutatorInCallStack, mutatorsThisProxy);

                    // install failing proxy to catch asynchronous code
                    let failingProxy = createFailingProxy();
                    Object.setPrototypeOf(mutatorsThisProxy, failingProxy);
                    mutatorCallStack.pop();

                    // check return value
                    failIfNotUndefined(result);
                }

                // commit new state
                if (isRootMutator) {
                    const stateProxy = mutators.state;
                    const stateOriginal = this_.state;
                    const newState = isTyduxDevelopmentModeEnabled() ? _.cloneDeep(stateOriginal) : {} as S;
                    _.assignIn(newState, stateProxy);

                    let storeMethodName = (this as any).storeMethodName;
                    storeMethodName = storeMethodName || "?";

                    const actionTypeName =
                            this_.storeName
                            + " # "
                            + storeMethodName
                            + " / "
                            + mutName;

                    const boundMutator = () => {
                        mutators[mutName].apply(mutators, args);
                    };
                    this_.processMutator(
                            createActionFromArguments(actionTypeName, mutatorFn, args),
                            newState,
                            boundMutator);
                }

                return result;
            };
        }

        return mutators;
    }

}
