import * as _ from "lodash";

import {Observable} from "rxjs/Observable";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Subject} from "rxjs/Subject";
import {deepFreeze} from "./deep-freeze";
import {globalStateChanges$, subscribeStore} from "./dev-tools";
import {isDevelopmentModeEnabled} from "./development";
import {assignStateValue, checkMutatorReturnType, createFailingProxy, createProxy} from "./mutators";
// import {Hooks} from "./hooks";
import "./rx-imports";
import {UnboundedObservable} from "./UnboundedObservable";
import {isShallowEquals} from "./utils";

const tyduxStateChangesSubject = new Subject<any>();
export const tyduxStateChanges: Observable<any> = tyduxStateChangesSubject.asObservable();


export class Event<S> {
    constructor(readonly action: any,
                readonly state: S,
                readonly boundMutator?: () => void) {
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

    private _state: S;

    private runningMutatorStack: string[] = [];

    private eventsSubject = new ReplaySubject<Event<S>>(1);

    protected readonly dispatch: M;

    protected ignoreMembers: (keyof this)[] = ["$q"] as any;

    readonly events$ = this.eventsSubject.asObservable();

    // readonly hooks: Hooks<M>;

    readonly mutatorNames: string[];

    constructor(storeName: string, mutators: M, state: S) {
        this.processMutator({type: "@@INIT"}, state);
        this.mutatorNames = this.createMutatorNamesList(mutators);
        this.dispatch = this.createDispatchers(mutators);
        // this.hooks = this.createHookSources();
        this.wrapMethods();

        const pushedStateForThisStore = globalStateChanges$.map(globalState => globalState[storeName]);

        pushedStateForThisStore
            .filter(s => !_.isNil(s))
            .subscribe(state => {
                this.setState(state);
            });

        subscribeStore(storeName, this);

        this.events$
            .subscribe(() => {
                tyduxStateChangesSubject.next();
            });
    }

    get state(): Readonly<S> {
        return this._state;
    }

    select<R>(): UnboundedObservable<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): UnboundedObservable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): UnboundedObservable<R> {
        const stream = this.eventsSubject
            .map(event => {
                return selector ? selector(event.state) :event.state as any;
            })
            .distinctUntilChanged((old, value) => {
                if (_.isArray(old) && _.isArray(value)) {
                    return isShallowEquals(old, value);
                } else {
                    return old === value;
                }
            });

        return new UnboundedObservable(stream);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined = _.identity as any): UnboundedObservable<R> {
        return this.select(selector)
            .pipe($ => $
                .filter(val => !_.isNil(val))
                .map(val => val!)
            );
    }

    private createMutatorNamesList(mutators: any) {
        let baseFnNames = _.functionsIn(Mutators.prototype);
        return _.difference(_.functionsIn(mutators), baseFnNames, this.ignoreMembers);
    }

    private createDispatchers(mutators: any) {
        const this_ = this;

        for (let mutName of this.mutatorNames) {
            const fn = mutators[mutName];
            mutators[mutName] = function () {
                // this_.invokeBeforeHook(mutName);

                const args = arguments;
                const rootMutator = this_.runningMutatorStack.length === 0;

                // create state copy
                if (rootMutator) {
                    const stateProxy = createProxy(this_.state);
                    assignStateValue(mutators, stateProxy);
                }

                // call mutator
                this_.runningMutatorStack.push(mutName);
                let result: any;
                const mutatorsThisProxy = createProxy(mutators);
                try {
                    result = fn.apply(mutatorsThisProxy, args);

                    let failingProxy = createFailingProxy();
                    Object.setPrototypeOf(mutatorsThisProxy, failingProxy);
                    result = isDevelopmentModeEnabled() ? checkMutatorReturnType(result) :result;
                    // result = Promise.resolve(result).then(() => this_.invokeAfterHook(mutName));
                } finally {
                    this_.runningMutatorStack.pop();
                }

                // commit new state
                if (rootMutator) {
                    const stateProxy = mutators.state;
                    const stateOriginal = this_.state;
                    const newState = isDevelopmentModeEnabled() ? _.cloneDeep(stateOriginal) :{} as S;
                    _.assignIn(newState, stateProxy);

                    const storeMethodName = (this as any).storeMethodName;
                    const typeName = storeMethodName ? mutName + ` (${storeMethodName})` :mutName;
                    const boundMutator = () => {
                        mutators[mutName].apply(mutators, args);
                    };
                    this_.processMutator(createActionFromArguments(typeName, fn, args), newState, boundMutator);

                    // if (isDevelopmentModeEnabled()) {
                    //     assignStateErrorGetter(mutators);
                    // }
                }

                return result;
            };
        }

        return mutators;
    }

    // private createHookSources() {
    //     const hooksSource: any = {};
    //
    //     for (let fnName of this.mutatorNames) {
    //         hooksSource[fnName] = {
    //             before: new Subject<void>(),
    //             after: new Subject<void>()
    //         };
    //     }
    //
    //     return hooksSource;
    // }

    private processMutator(action: any, state: S, boundMutator?: () => void) {
        this.setState(state);
        this.eventsSubject.next(new Event(action, this._state, boundMutator));
    }

    private setState(state: S) {
        this._state = isDevelopmentModeEnabled() ? deepFreeze(state) :state;
    }

    // private invokeBeforeHook(mutatorName: string) {
    //     let mutatorHooks = this.hooks[mutatorName];
    //     let subject = mutatorHooks.before as Subject<void>;
    //     subject.next();
    // }
    //
    // private invokeAfterHook(mutatorName: string) {
    //     let mutatorHooks = this.hooks[mutatorName];
    //     let subject = mutatorHooks.after as Subject<void>;
    //     subject.next();
    // }

    private wrapMethods() {
        const methods: string[] = _.functions(Object.getPrototypeOf(this));

        for (let method of methods) {
            const dispatcherProxy = {
                storeMethodName: method,
            };
            Object.setPrototypeOf(dispatcherProxy, this.dispatch);

            const storeProxy = {
                dispatch: dispatcherProxy
            };
            Object.setPrototypeOf(storeProxy, this);

            const original = (this as any)[method];
            (this as any)[method] = function () {
                original.apply(storeProxy, arguments);
            };
        }
    }
}

export abstract class Mutators<T> {
    protected state: T;
}
