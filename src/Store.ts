import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {addStoreToGlobalState, MutatorEvent} from "./global-state";
import {
    assignStateValue,
    createFailingProxy,
    createProxy,
    failIfInstanceMembersExist,
    failIfNotUndefined,
    Mutators
} from "./mutators";
import {UnboundedObservable} from "./UnboundedObservable";
import {areArraysShallowEquals, arePlainObjectsShallowEquals} from "./utils";
import produce from "immer";

export interface Action {
    [param: string]: any;

    type: string;
}

export interface StateChange<S> {
    state: S;
    mutatorEvent: MutatorEvent;
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

export type MutatorsConstructor<M, S> = {
    new(mutateState: (fn: (state: S) => StateChange<S>) => void): M;
};

export abstract class Store<M extends Mutators<S>, S> implements Store<M, S> {

    private _state: S = undefined as any;

    private mutatorCallStackCount = 0;

    private readonly stateChangesSubject = new ReplaySubject<StateChange<S>>(1);

    protected readonly mutate: M;

    readonly mutatorEvents$: Observable<MutatorEvent> = this.stateChangesSubject.pipe(
        map(stateChange => stateChange.mutatorEvent)
    );

    constructor(readonly storeId: string,
                mutatorsConstructor: MutatorsConstructor<M, S>,
                state: S) {

        this.processMutator({type: "@@INIT"}, state);

        this.mutate = new mutatorsConstructor(this.mutateState.bind(this));
        delete (this.mutate as any).state;
        // failIfInstanceMembersExist(this.mutate);

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
                return !_.isNil(selector) ? selector(stateChange.state) : stateChange.state as any;
            }),
            distinctUntilChanged((oldVal, newVal) => {
                if (_.isArray(oldVal) && _.isArray(newVal)) {
                    return areArraysShallowEquals(oldVal, newVal);
                } else if (_.isPlainObject(newVal) && _.isPlainObject(newVal)) {
                    return arePlainObjectsShallowEquals(oldVal, newVal);
                } else {
                    return oldVal === newVal;
                }
            }));

        return new UnboundedObservable(stream);
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): UnboundedObservable<R> {
        return new UnboundedObservable(
            this.select(selector).asObservable().pipe(
                filter(val => !_.isNil(val)),
                map(val => val!)
            ));
    }

    private processMutator(action: Action, state: S, duration?: number) {
        this.setState(state);
        this.stateChangesSubject.next({
            mutatorEvent: new MutatorEvent(this.storeId, action, duration),
            state: this._state
        });
    }

    private setState(state: S) {
        // this._state = isTyduxDevelopmentModeEnabled() ? deepFreeze(state) : state;
        this._state = state;
    }

    private mutateState(fn: (state: S) => StateChange<S>): void {
        const isRoot = this.mutatorCallStackCount === 0;
        this.mutatorCallStackCount++;
        try {
            const newState = produce(this.state, draftState => {
                let stateChange = fn(draftState);
                console.log("stateChange", stateChange);
                return stateChange.state;
            });

            if (isRoot) {
                this.stateChangesSubject.next(newState);
                this.setState(newState);
            }
        } finally {
            this.mutatorCallStackCount--;
        }


    }


    private createMutatorsProxy(mutatorsSource: any) {
        delete mutatorsSource.state;
        const this_ = this;

        const mutatorMethods: any = {};

        let mutatorCallStackCount = 0;

        for (let mutName of _.functionsIn(mutatorsSource)) {
            const mutatorFn = mutatorsSource[mutName];

            // replace with wrapped method
            mutatorMethods[mutName] = function () {
                const args = arguments;
                const isRootMutator = mutatorCallStackCount === 0;
                const mutatorThis: any = isRootMutator ? {} : this;

                // create state mock
                if (isRootMutator) {
                    const mockState = createProxy(this_.state);
                    assignStateValue(mutatorThis, mockState);
                    Object.setPrototypeOf(mutatorThis, mutatorMethods);
                }

                // call mutator
                let duration: number;
                let result: any;
                let mockState: any;
                mutatorCallStackCount++;
                try {
                    const start = isTyduxDevelopmentModeEnabled() ? Date.now() : 0;
                    result = mutatorFn.apply(mutatorThis, args);
                    duration = isTyduxDevelopmentModeEnabled() ? Date.now() - start : -1;
                } finally {
                    mutatorCallStackCount--;
                    failIfNotUndefined(result);
                }

                // commit new state
                if (isRootMutator) {
                    // install failing proxy to catch asynchronous code
                    mockState = mutatorThis.state;
                    delete mutatorThis.state;
                    failIfInstanceMembersExist(mutatorThis);

                    if (isTyduxDevelopmentModeEnabled()) {
                        Object.setPrototypeOf(mutatorThis, createFailingProxy());
                    }

                    // merge mock state -> state
                    const originalState = this_.state;
                    const newState = isTyduxDevelopmentModeEnabled() ? _.cloneDeep(originalState) : {} as S;
                    _.assignIn(newState, mockState);

                    this_.processMutator(
                        createActionFromArguments(mutName, mutatorFn, args),
                        newState,
                        duration);
                }

                return result;
            };
        }

        return mutatorMethods;
    }

}
