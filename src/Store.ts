import * as icepick from "icepick";
import * as _ from "lodash";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mapTo";


let developmentMode = false;


export function enableDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
}

function assignStateErrorGetter(obj: { state: any }) {
    Object.defineProperty(obj, "state", {
        configurable: true,
        enumerable: false,
        get: () => {
            throw new Error("Actions can only access 'this.state' during method calls. " +
                "Make sure that 'this.state' is not accessed by asynchronous handlers, e.g. 'setTimeout(...)'.");
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
    _.forIn(target, (value, key) => {
        proxy[key!] = value;
    });
    Object.setPrototypeOf(proxy, target);
    return proxy;
}

export class Store<S, A extends Actions<S>> {

    readonly dispatch: A;

    private _state: S;

    constructor(actions: A, state: S) {
        this._state = icepick.freeze(state);
        this.dispatch = this.wrapActions(actions);
    }

    get state(): S {
        return this._state;
    }

    private wrapActions(actions: any) {
        const this_ = this;
        let baseFnNames = _.functionsIn(Actions.prototype);
        let fnNames = _.difference(_.functionsIn(actions), baseFnNames);

        for (let fnName of fnNames) {
            const fn = actions[fnName];
            actions[fnName] = function () {
                const stateProxy = createProxy(this_.state);

                assignStateValue(actions, stateProxy);
                fn.apply(actions, arguments);
                this_._state = icepick.freeze(actions.state);
                assignStateErrorGetter(actions);
            };
        }

        return actions;
    }
}

export abstract class Actions<T> {

    protected state: T;

    // private setInnerState(state: T) {
    //     this.innerState = icepick.freeze(state);
    //     this.events.next(this.innerState);
    // }

    // select<R>(selector: (state: T) => R = _.identity): Observable<R> {
    //     return this.events
    //             .map(state => {
    //                 return selector(state);
    //             })
    //             .distinctUntilChanged((old, value) => {
    //                 return old === value;
    //             });
    // }

    // protected defaultActionOptions(): ActionOptions<T> {
    //     return {};
    // }

    // protected action(actionName: string, fn: (data: T) => T | void, actionOptions?: ActionOptions<T>): T {
    //     const options = _.merge(this.defaultActionOptions(), actionOptions);
    //
    //     let result: T;
    //     try {
    //         const copy = icepick.thaw(this.innerState);
    //         result = fn.apply(this, [copy]);
    //         if (result === undefined) {
    //             result = copy;
    //         }
    //     } catch (e) {
    //         throw e;
    //     }
    //
    //     this.setInnerState(result);
    //
    //     if (options.afterAction) {
    //         options.afterAction(this, this.innerState, new Set<string>(), new Set<string>());
    //     }
    //
    //     return result;
    // }
}
