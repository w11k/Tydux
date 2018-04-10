import * as _ from "lodash";
import {OperatorFunction} from "rxjs/interfaces";
import {Observable} from "rxjs/Observable";
import {map} from "rxjs/operators/map";
import {filter} from "rxjs/operators/filter";
import {distinctUntilChanged} from "rxjs/operators/distinctUntilChanged";
import {Mutators} from "./mutators";
import {MutatorEvent, Store} from "./Store";
import {areArraysShallowEquals, arePlainObjectsShallowEquals} from "./utils";

export function noopOperator<S>(stream: Observable<MutatorEvent<S>>): Observable<MutatorEvent<S>> {
    return stream;
}


export class StoreObserver<S> {

    constructor(readonly mutatorEvents$: Observable<MutatorEvent<S>>,
                readonly operator: OperatorFunction<MutatorEvent<S>, MutatorEvent<S>>) {
    }

    select<R>(): Observable<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): Observable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R> {
        return this.mutatorEvents$
            .pipe(
            this.operator!,
            map(mutatorEvent => {
                return !_.isNil(selector) ? selector(mutatorEvent.state) : mutatorEvent.state as any;
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
    }

    selectNonNil<R>(selector: (state: Readonly<S>) => R | null | undefined): Observable<R> {
        return this.select(selector).pipe(
                filter(val => !_.isNil(val)),
                map(val => val!)
            );
    }

}
