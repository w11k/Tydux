import * as icepick from "icepick";
import * as _ from "lodash";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import {Observable} from "rxjs/Observable";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {globalStateChanges$, isDevelopmentModeEnabled, subscribeStore} from "./devTools";
import {illegalAccessToThisState, modifierWrongReturnType} from "./error-messages";

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

function checkModifierReturnType(obj: any) {
    if (obj !== undefined && typeof obj.then === "function") {
        return obj.then((val: any) => {
            if (val !== undefined) {
                throw new Error(modifierWrongReturnType);
            }
            return undefined;
        });

    } else if (obj === undefined) {
        return undefined;
    }

    throw new Error(modifierWrongReturnType);
}

export class Event<S> {
    constructor(public readonly action: any,
                public readonly state: S,
                public readonly boundModifier?: () => void) {
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

export interface Store<M extends Modifiers<S>, S> {

    readonly dispatch: M;

    readonly events$: Observable<Event<S>>;

    readonly state: Readonly<S>;

    select(): Observable<Readonly<S>>;

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R>;

    selectNonNil<R>(selector: (state: Readonly<S>) => R): Observable<R>;

}

class StoreImpl<M extends Modifiers<S>, S> implements Store<M, S> {

    readonly dispatch: M;

    private _state: S;

    private modifierRunning = false;

    private eventsSubject = new ReplaySubject<Event<S>>(1);

    // noinspection JSUnusedGlobalSymbols
    readonly events$ = this.eventsSubject.asObservable();

    constructor(modifiers: M, state: S, pushedStateChanges: Observable<S>) {
        this.processModifier({type: "@@INIT"}, state);
        this.dispatch = this.wrapModifiers(modifiers);

        pushedStateChanges
            .subscribe(state => {
                this.setState(state);
            });
    }

    get state(): Readonly<S> {
        return this._state;
    }

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R> {
        return this.eventsSubject
            .map(event => {
                return selector ? selector(event.state) : event.state as any;
            })
            .distinctUntilChanged((old, value) => {
                return old === value;
            });
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R = _.identity as any): Observable<R> {
        return this.select(selector).filter(val => !_.isNil(val));
    }

    private wrapModifiers(modifiers: any) {
        const this_ = this;
        let baseFnNames = _.functionsIn(Modifiers.prototype);
        let fnNames = _.difference(_.functionsIn(modifiers), baseFnNames);

        for (let fnName of fnNames) {
            const fn = modifiers[fnName];
            modifiers[fnName] = function () {
                const args = arguments;
                const rootModifier = !this_.modifierRunning;

                // create state copy
                if (rootModifier) {
                    const stateProxy = createProxy(this_.state);
                    assignStateValue(modifiers, stateProxy);
                }

                // call modifier
                this_.modifierRunning = true;
                let result: any;
                try {
                    result = fn.apply(modifiers, args);
                    result = isDevelopmentModeEnabled() ? checkModifierReturnType(result) : result;
                } finally {
                    this_.modifierRunning = false;
                }

                // commit new state
                if (rootModifier) {
                    const stateProxy = modifiers.state;
                    const stateOriginal = this_.state;
                    const newState = isDevelopmentModeEnabled() ? _.cloneDeep(stateOriginal) : {} as S;
                    _.assignIn(newState, stateProxy);

                    const boundModifier = () => {
                        modifiers[fnName].apply(modifiers, args);
                    };
                    this_.processModifier(createActionFromArguments(fnName, fn, args), newState, boundModifier);

                    if (isDevelopmentModeEnabled()) {
                        assignStateErrorGetter(modifiers);
                    }
                }

                return result;
            };
        }

        return modifiers;
    }

    private processModifier(action: any, state: S, boundModifier?: () => void) {
        this.setState(state);
        this.eventsSubject.next(new Event(action, this._state, boundModifier));
    }

    private setState(state: S) {
        this._state = isDevelopmentModeEnabled() ? icepick.freeze(state) : state;
    }
}

export function createStore<M extends Modifiers<S>, S>(name: string,
                                                       modifiers: M, initialState: S): Store<M, S> {

    const store = new StoreImpl<M, S>(
        modifiers,
        initialState,
        globalStateChanges$.map(globalState => globalState[name])
    );
    subscribeStore(name, store);
    return store;

}

export abstract class Modifiers<T> {

    protected state: T;

}
