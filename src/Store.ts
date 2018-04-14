import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {StoreObserver} from "./StoreObserver";
import {createActionFromArguments, createProxy} from "./utils";

export class StateMutators<S> {

    protected state!: S;

    // noinspection JSUnusedLocalSymbols: accessed during Store initialization
    constructor(private initialState: S) {
    }
}

export type MutatorsState<G> = G extends StateMutators<infer S> ? Readonly<S> : never;

export type State<S> = {
    [K in keyof S]: S[K] extends StateMutators<any> ? MutatorsState<S[K]> : State<S[K]>;
};

export interface Action {
    [param: string]: any;

    type: string;
}

export class StateChangeEvent<S> {
    constructor(readonly action: Action,
                readonly state: S,
                public duration: number | null) {
    }
}

type MergeStateFn = (action: Action, duration: number | null, path: string[], stateChange: any) => void;

// const mutatorsToStateSymbol = Symbol("mutators-to-state-symbol");
const mutatorsToStateSymbol = "__mutators-to-state-symbol__";

function instrumentStructure(mergeState: MergeStateFn,
                             stateGetter: () => any,
                             mutatorsStructure: any,
                             path: string[],
                             structure: any) {



    _.forIn(structure, (child, key) => {
        const localPath = _.cloneDeep(path);
        localPath.push(key);

        _.set(mutatorsStructure, localPath, child);

        if (_.isPlainObject(child)) {
            _.set(mutatorsStructure, [...localPath, mutatorsToStateSymbol], 123);


            instrumentStructure(mergeState, stateGetter, mutatorsStructure, localPath, child);
        } else {
            if (child instanceof StateMutators) {
                _.set(stateGetter(), localPath, (child as any).initialState);
                instrumentMutators(mergeState, stateGetter, localPath, child);
            } else {
                _.set(stateGetter(), localPath, child);
            }
        }
    });
}

function instrumentMutators(mergeState: MergeStateFn,
                            stateGetter: () => any,
                            path: string[],
                            mutators: any) {

    for (let mutatorName of _.functionsIn(mutators)) {
        const mutatorFn = mutators[mutatorName];

        mutators[mutatorName] = function () {
            const tyduxDevelopmentModeEnabled = isTyduxDevelopmentModeEnabled();

            const args = arguments;
            const tempThis: any = {};

            let storeState = stateGetter();
            const localState = _.get(storeState, path);
            tempThis.state = createProxy(localState);

            Object.setPrototypeOf(tempThis, mutators);

            const start = tyduxDevelopmentModeEnabled ? Date.now() : 0;
            const result = mutatorFn.apply(tempThis, args);
            const duration = tyduxDevelopmentModeEnabled ? Date.now() - start : null;
            const actionName = path.join(".") + "." + mutatorName;

            mergeState(
                createActionFromArguments(actionName, mutatorFn, args),
                duration,
                path,
                tempThis.state
            );
            return result;
        };

    }
}

export class Store<S> {

    static create<S>(structure: S): Store<S> {

        const mutatorsStructure: any = {};

        const store = new Store<S>(mutatorsStructure);
        store._state = {} as any;

        instrumentStructure(
            store.mergeState.bind(store),
            () => store.state,
            store.mutate,
            [],
            structure
        );

        store.setState({type: "@@INIT"}, null, store.state, true);

        return store;
    }

    readonly mutate!: S;

    private _state!: State<S>;

    get state(): Readonly<State<S>> {
        return this._state;
    }

    private readonly stateChangesSubject = new ReplaySubject<StateChangeEvent<State<S>>>(1);

    readonly stateChanges: Observable<StateChangeEvent<State<S>>> = this.stateChangesSubject.asObservable();

    private constructor(mutatorsStructure: any) {
        this.mutate = mutatorsStructure;
        // this.setState({type: "@@INIT"}, null, this.state, true);
    }


    private mergeState(action: Action, duration: number | null, path: string[], stateChange: any) {

        if (path.length === 0) {
            this.setState(action, duration, stateChange);
            return;
        }

        const parentStateChange: any = {};
        let parentPath = path.slice(0, path.length - 1);
        let parentState = parentPath.length > 0 ? _.get(this.state, parentPath) : this.state;
        Object.assign(parentStateChange, parentState);
        parentStateChange[_.last(path)!] = stateChange;

        this.mergeState(action, duration, parentPath, parentStateChange);
    }

    private setState(action: Action, duration: number | null, state: State<S>, force = false) {
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

    getView<C>(fn: (store: S) => C): Store<C> {
        let viewMutators = fn(this.mutate);
        const view = new Store<C>(viewMutators);

        console.log("viewMutators", JSON.stringify(viewMutators));
        let viewState = (viewMutators as any)[mutatorsToStateSymbol];
        console.log("viewState", viewState);

        return view;
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

