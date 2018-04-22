import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {map} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {deepFreeze} from "./deep-freeze";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {mutatorHasInstanceMembers} from "./error-messages";
import {addStoreToGlobalState} from "./global-state";
import {Mutator} from "./mutator";
import {StateObserver} from "./StateObserver";
import {StateObserverProvider} from "./StateObserverProvider";
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

export abstract class Store<M extends Mutator<S>, S> implements StateObserverProvider<S> {

    private _state: S = undefined as any;

    private mutatorCallStackCount = 0;

    private readonly mutatorEventsSubject = new ReplaySubject<MutatorEvent<S>>(1);

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

        this.mutate = this.createMutatorsProxy(mutatorInstance);
        delete (this.mutate as any).state;

        addStoreToGlobalState(this);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    bounded(operator: Operator<S, S>): StateObserver<S> {
        return new StateObserver(this.mutatorEvents$.pipe(map(e => e.state)), operator);
    }

    unbounded(): StateObserver<S> {
        return new StateObserver(this.mutatorEvents$.pipe(map(e => e.state)));
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
