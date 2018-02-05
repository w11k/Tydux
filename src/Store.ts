import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {globalStateChanges$, MutatorEvent, subscribeStore} from "./dev-tools";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {assignStateValue, createFailingProxy, createProxy, Mutators} from "./mutators";
import {UnboundedObservable} from "./UnboundedObservable";
import {isShallowEquals} from "./utils";


function createActionFromArguments(actionTypeName: string, fn: any, args: IArguments): any {
    const fnString = fn.toString();
    const argsString = fnString.substring(fnString.indexOf("(") + 1, fnString.indexOf(")"));
    const argNames = argsString.split(",").map((a: string) => a.trim());

    const action: any = {};
    for (let i = 0; i < argNames.length; i++) {
        const arg = "[" + i + "] " + argNames[i];
        action[arg] = args[i];
    }
    action.type = actionTypeName;

    return action;
}

export abstract class Store<M extends Mutators<S>, S> implements Store<M, S> {

    private _state: S = undefined as any;

    private eventsSubject = new ReplaySubject<MutatorEvent<S>>(1);

    protected readonly mutate: M;

    protected ignoreMembers: (keyof this)[] = ["$q"] as any;

    readonly events$: Observable<MutatorEvent<S>> = this.eventsSubject.asObservable();

    constructor(public readonly storeName: string, mutators: M, state: S) {
        this.processMutator({type: "@@INIT"}, state);

        this.mutate = this.instrumentAndReturnMutators(mutators);

        this.wrapStoreMethods();

        // const pushedStateForThisStore = globalStateChanges$.pipe(
        //     map(globalState => globalState[storeName]));
        //
        // pushedStateForThisStore.pipe(
        //     filter(s => !_.isNil(s)))
        //     .subscribe(state => {
        //         this.setState(state);
        //     });

        subscribeStore(storeName, this);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    select<R>(): UnboundedObservable<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): UnboundedObservable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): UnboundedObservable<R> {
        const stream = this.eventsSubject.pipe(
            map(event => {
                return selector ? selector(event.state) : event.state as any;
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

    private createMutatorNamesList(mutators: any) {
        let baseFnNames = _.functionsIn(Mutators.prototype);
        return _.difference(_.functionsIn(mutators), baseFnNames, this.ignoreMembers);
    }

    private instrumentAndReturnMutators(mutators: any): M {
        const this_ = this;

        const mutatorNames = this.createMutatorNamesList(mutators);
        const mutatorCallStack: any[] = [mutators];

        for (let mutName of mutatorNames) {
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
                }

                // commit new state
                if (isRootMutator) {
                    const stateProxy = mutators.state;
                    const stateOriginal = this_.state;
                    const newState = isTyduxDevelopmentModeEnabled() ? _.cloneDeep(stateOriginal) : {} as S;
                    _.assignIn(newState, stateProxy);

                    const storeMethodName = (this as any).storeMethodName;
                    const actionTypeName = storeMethodName ? storeMethodName + " / " + mutName : mutName;
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

    private processMutator(action: any, state: S, boundMutator?: () => void) {
        this.setState(state);
        this.eventsSubject.next(new MutatorEvent(this.storeName, action, this._state, boundMutator));
    }

    private setState(state: S) {
        this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
    }

    private wrapStoreMethods() {
        const originalMutate = this.mutate;
        const methods: string[] = _.functions(Object.getPrototypeOf(this));

        for (let method of methods) {
            const mutatorInstanceProxy = {
                storeMethodName: method,
            };
            Object.setPrototypeOf(mutatorInstanceProxy, originalMutate);

            const storeProxy = {
                mutate: mutatorInstanceProxy
            };
            Object.setPrototypeOf(storeProxy, this);

            const original = (this as any)[method];
            (this as any)[method] = function () {
                try {
                    return original.apply(storeProxy, arguments);
                } finally {
                    // transfer created/modified instance members
                    _.assignInWith(this, storeProxy);
                    this.mutate = originalMutate;
                }
            };
        }
    }
}
