import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {StoreObserver} from "./StoreObserver";
import {createActionFromArguments, createProxy} from "./utils";

export class StateMutators<S> {

    protected state!: S;

    // noinspection JSUnusedLocalSymbols: read during Store initialization
    constructor(private initialState: S) {
    }
}

export type StateGroupState<G> = G extends StateMutators<infer S> ? Readonly<S> : never;

export type State<S> = {
    [K in keyof S]: S[K] extends StateMutators<any> ? StateGroupState<S[K]> : State<S[K]>;
};

export interface Action {
    [param: string]: any;

    type: string;
}

export class StateChangeEvent<S> {
    constructor(readonly action: Action,
                readonly state: S,
                public duration: number|null) {
    }
}

export class Store<S> {

    readonly mutate: S;

    private _state: State<S>;

    get state(): Readonly<State<S>> {
        return this._state;
    }

    private readonly stateChangesSubject = new ReplaySubject<StateChangeEvent<State<S>>>(1);

    readonly stateChanges: Observable<StateChangeEvent<State<S>>> = this.stateChangesSubject.asObservable();

    constructor(rootStateGroup: S) {
        this.mutate = rootStateGroup;
        this._state = {} as any;

        this.traverse([], rootStateGroup);

        deepFreeze(this._state);

        this.setState({type: "@@INIT"}, null, this.state, true);
    }

    private traverse(path: string[], obj: any) {
        _.forIn(obj, (val, key) => {
            const localPath = _.cloneDeep(path);
            localPath.push(key);

            if (_.isPlainObject(val)) {
                this.traverse(localPath, val);
            } else if (val instanceof StateMutators) {
                _.set(this._state, localPath, (val as any).initialState);
                this.instrumentStateGroup(localPath, val);
            } else {
                _.set(this._state, localPath, val);
            }
        });
    }

    private instrumentStateGroup(stateGroupPath: string[], stateGroup: any) {
        const this_ = this;

        for (let mutatorName of _.functionsIn(stateGroup)) {
            const mutatorFn = stateGroup[mutatorName];

            stateGroup[mutatorName] = function () {
                const tyduxDevelopmentModeEnabled = isTyduxDevelopmentModeEnabled();

                const args = arguments;
                const tempThis: any = {};

                const localState = _.get(this_.state, stateGroupPath);
                tempThis.state = createProxy(localState);

                Object.setPrototypeOf(tempThis, stateGroup);

                const start = tyduxDevelopmentModeEnabled ? Date.now() : 0;
                const result = mutatorFn.apply(tempThis, args);
                const duration = tyduxDevelopmentModeEnabled ? Date.now() - start : null;
                const actionName = stateGroupPath.join(".") + "." + mutatorName;
                this_.mergeState(
                    createActionFromArguments(actionName, mutatorFn, args),
                    duration,
                    stateGroupPath,
                    tempThis.state
                );
                return result;
            };

        }
    }

    private mergeState(action: Action, duration: number|null, path: string[], stateChange: any) {
        if (path.length === 0) {
            this.setState(action, duration, stateChange);
            return;
        }

        const parentStateChange: any = {};
        let parentPath = path.slice(0, path.length - 1);
        Object.assign(parentStateChange, _.get(this._state, parentPath));
        parentStateChange[_.last(path)!] = stateChange;

        this.mergeState(action, duration, parentPath, parentStateChange);
    }

    private setState(action: Action, duration: number|null, state: State<S>, force = false) {
        if (force || state !== this._state) {
            this._state = state;
            const event = new StateChangeEvent(action, state, duration);
            this.stateChangesSubject.next(event);
        }
    }

    bounded(operator: Operator<StateChangeEvent<State<S>>, StateChangeEvent<State<S>>>): StoreObserver<State<S>> {
        return new StoreObserver(this.stateChanges, operator);
    }

    unbounded(): StoreObserver<State<S>> {
        return new StoreObserver(this.stateChanges);
    }

    getChild<C>(fn: (store: S) => C): Store<C> {
        return {
            mutate: fn(this.mutate) as any as C,
            state: null as any as State<C>
        };
    }

}

/*
import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {mutatorHasInstanceMembers} from "./error-messages";
import {addStoreToGlobalState} from "./global-state";
import {Mutators} from "./mutators";
import {StoreObserver} from "./StoreObserver";
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
    let members = _.keys(obj);
    let idxOfState = members.indexOf("state");
    if (idxOfState >= 0) {
        members.splice(idxOfState, 1);
    }
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

export abstract class Store<M extends Mutators<S>, S> {

    private _state: S = undefined as any;

    private mutatorCallStackCount = 0;

    private readonly mutatorEventsSubject = new ReplaySubject<MutatorEvent<S>>(1);

    protected readonly mutate: M;

    readonly mutatorEvents$: Observable<MutatorEvent<S>> = this.mutatorEventsSubject;

    constructor(readonly storeId: string,
                mutatorInstance: Mutators<S>,
                state: S) {

        this.processMutator(new MutatorEvent(
            this.storeId,
            {type: "@@INIT"},
            state
        ));

        failIfInstanceMembersExistExceptState(mutatorInstance);

        this.mutate = this.createMutatorsProxy(mutatorInstance);
        delete (this.mutate as any).state;

        addStoreToGlobalState(this);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    bounded(operator: Operator<MutatorEvent<S>, MutatorEvent<S>>): StoreObserver<S> {
        return new StoreObserver(this.mutatorEvents$, operator);
    }

    unbounded(): StoreObserver<S> {
        return new StoreObserver(this.mutatorEvents$);
    }

    private processMutator(mutatorEvent: MutatorEvent<S>) {
        this.setState(mutatorEvent.state);
        this.mutatorEventsSubject.next(mutatorEvent);
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

    private createMutatorsProxy(mutatorsInstance: any): M {
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

                    const mutatorEvent = new MutatorEvent(
                        self.storeId,
                        createActionFromArguments(mutatorName, mutatorFn, args),
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
*/

