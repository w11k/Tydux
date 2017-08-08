import * as icepick from "icepick";
import * as _ from "lodash";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mapTo";
import {Observable} from "rxjs/Observable";
import {ReplaySubject} from "rxjs/ReplaySubject";


let developmentMode = false;

export interface ActionOptions<T> {
    afterAction?: (store: Store<T>, state: T, modifiedFields: Set<string>, newFields: Set<string>) => void;
    log?: boolean;
}

export function enableDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
}


export abstract class Store<T> {

    private innerState: T;

    private events = new ReplaySubject<T>(1);

    constructor(state: T) {
        this.setInnerState(state);
    }

    private setInnerState(state: T) {
        this.innerState = icepick.freeze(state);
        this.events.next(this.innerState);
    }

    select<R>(selector: (state: T) => R = _.identity): Observable<R> {
        return this.events
                .map(state => {
                    return selector(state);
                })
                .distinctUntilChanged((old, value) => {
                    return old === value;
                });
    }

    protected defaultActionOptions(): ActionOptions<T> {
        return {};
    }

    protected action(actionName: string, fn: (data: T) => T | void, actionOptions?: ActionOptions<T>): T {
        const options = _.merge(this.defaultActionOptions(), actionOptions);

        let result: T;
        try {
            const copy = icepick.thaw(this.innerState);
            result = fn.apply(this, [copy]);
            if (result === undefined) {
                result = copy;
            }
        } catch (e) {
            throw e;
        }

        this.setInnerState(result);

        if (options.afterAction) {
            options.afterAction(this, this.innerState, new Set<string>(), new Set<string>());
        }

        return result;
    }
}
