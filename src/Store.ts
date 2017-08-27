import * as _ from "lodash";
import "rxjs";
// import "rxjs/add/operator/distinctUntilChanged";
// import "rxjs/add/operator/filter";
// import "rxjs/add/operator/map";
import {Observable} from "rxjs/Observable";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {globalStateChanges$, isDevelopmentModeEnabled, subscribeStore} from "./devTools";
import {illegalAccessToThisState, mutatorWrongReturnType} from "./error-messages";
import {isShallowEquals} from "./utils";

function assignStateErrorGetter(obj: { state: any }) {
    Object.defineProperty(obj, "state", {
        configurable: true,
        enumerable: false,
        get: () => {
            throw new Error(illegalAccessToThisState);
        }
    });
}

function assignStateValue<S>(obj: { state: S }, state: S) {
    const stateContainer = [state];
    Object.defineProperty(obj, "state", {
        configurable: true,
        enumerable: false,
        get: () => {
            return stateContainer[0];
        },
        set: (value: any) => {
            stateContainer[0] = value;
        }
    });
}

function createProxy<T>(target: T): T {
    const proxy: any = {};
    // re-assign members. Otherwise these members would be marked as read only.
    _.assignIn(proxy, target);
    Object.setPrototypeOf(proxy, target);
    return proxy;
}

function checkMutatorReturnType(obj: any) {
    if (obj !== undefined && typeof obj.then === "function") {
        return obj.then((val: any) => {
            if (val !== undefined) {
                throw new Error(mutatorWrongReturnType);
            }
            return undefined;
        });

    } else if (obj === undefined) {
        return undefined;
    }

    throw new Error(mutatorWrongReturnType);
}

export class Event<S> {
    constructor(public readonly action: any,
                public readonly state: S,
                public readonly boundMutator?: () => void) {
    }
}

function createActionFromArguments(fnName: string, fn: any, args: IArguments): any {
    const fnString = fn.toString();
    const argsString = fnString.substring(fnString.indexOf("(") + 1, fnString.indexOf(")"));
    const argNames = argsString.split(",").map((a: string) => a.trim());

    const action: any = {};
    for (let i = 0; i < argNames.length; i++) {
        const arg = "[" + i + "] " + argNames[i];
        action[arg] = args[i];
    }
    action.type = fnName;
    // action.__argNames = argNames;

    return action;
}

export abstract class Store<M extends Mutators<S>, S> implements Store<M, S> {

    readonly dispatch: M;

    private _state: S;

    private runningMutatorStack: string[] = [];

    private eventsSubject = new ReplaySubject<Event<S>>(1);

    // noinspection JSUnusedGlobalSymbols
    readonly events$ = this.eventsSubject.asObservable();

    constructor(storeName: string, mutators: M, state: S) {
        this.processMutator({type: "@@INIT"}, state);
        this.dispatch = this.wrapMutators(mutators);

        const pushedStateForThisStore = globalStateChanges$.map(globalState => globalState[storeName]);
        pushedStateForThisStore
                .subscribe(state => {
                    this.setState(state);
                });

        subscribeStore(storeName, this);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    select<R>(): Observable<S>;

    select<R>(selector: (state: Readonly<S>) => R): Observable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R> {
        return this.eventsSubject
                .map(event => {
                    return selector ? selector(event.state) : event.state as any;
                })
                .distinctUntilChanged((old, value) => {
                    if (_.isArray(old) && _.isArray(value)) {
                        return isShallowEquals(old, value);
                    } else {
                        return old === value;
                    }
                });
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined = _.identity as any): Observable<R> {
        return this.select(selector)
                .filter(val => !_.isNil(val))
                .map(val => val!);
    }

    private wrapMutators(mutators: any) {
        const this_ = this;
        let baseFnNames = _.functionsIn(Mutators.prototype);
        let fnNames = _.difference(_.functionsIn(mutators), baseFnNames);

        for (let fnName of fnNames) {
            const fn = mutators[fnName];
            mutators[fnName] = function () {
                const args = arguments;
                const rootMutator = this_.runningMutatorStack.length === 0;

                // create state copy
                if (rootMutator) {
                    const stateProxy = createProxy(this_.state);
                    assignStateValue(mutators, stateProxy);
                }

                // call mutator
                this_.runningMutatorStack.push(fnName);
                let result: any;
                try {
                    result = fn.apply(mutators, args);
                    result = isDevelopmentModeEnabled() ? checkMutatorReturnType(result) : result;
                } finally {
                    this_.runningMutatorStack.pop();
                }

                // commit new state
                if (rootMutator) {
                    const stateProxy = mutators.state;
                    const stateOriginal = this_.state;
                    const newState = isDevelopmentModeEnabled() ? _.cloneDeep(stateOriginal) : {} as S;
                    _.assignIn(newState, stateProxy);

                    const boundMutator = () => {
                        mutators[fnName].apply(mutators, args);
                    };
                    this_.processMutator(createActionFromArguments(fnName, fn, args), newState, boundMutator);

                    if (isDevelopmentModeEnabled()) {
                        assignStateErrorGetter(mutators);
                    }
                }

                return result;
            };
        }

        return mutators;
    }

    private processMutator(action: any, state: S, boundMutator?: () => void) {
        this.setState(state);
        this.eventsSubject.next(new Event(action, this._state, boundMutator));
    }

    private setState(state: S) {
        this._state = isDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }
}

class StoreImpl<M extends Mutators<S>, S> extends Store<M, S> {
    constructor(storeName: string, mutators: M, state: S) {
        super(storeName, mutators, state);
    }
}

export function createStore<M extends Mutators<S>, S>(name: string,
                                                      mutators: M,
                                                      initialState: S): Store<M, S> {

    return new StoreImpl<M, S>(name, mutators, initialState);
}

export abstract class Mutators<T> {

    protected state: T;

}
