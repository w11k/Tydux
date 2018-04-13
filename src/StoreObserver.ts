import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {distinctUntilChanged} from "rxjs/operators/distinctUntilChanged";
import {filter} from "rxjs/operators/filter";
import {map} from "rxjs/operators/map";
import {StateChangeEvent} from "./Store";
import {areArraysShallowEquals, arePlainObjectsShallowEquals} from "./utils";

export class StoreObserver<S> {

    constructor(readonly mutatorEvents$: Observable<StateChangeEvent<S>>,
                readonly operator?: Operator<StateChangeEvent<S>, StateChangeEvent<S>>) {
    }

    select(): Observable<Readonly<S>>;

    select<R>(selector: (state: Readonly<S>) => R): Observable<R>;

    select<R>(selector?: (state: Readonly<S>) => R): Observable<R> {
        const stream = _.isNil(this.operator)
            ? this.mutatorEvents$
            : this.mutatorEvents$.lift(this.operator);

        return stream
            .pipe(
                map(mutatorEvent => {
                    return !_.isNil(selector) ? selector(mutatorEvent.state) : mutatorEvent.state as any;
                }),
                distinctUntilChanged((oldVal, newVal) => {
                    if (_.isArray(oldVal) && _.isArray(newVal)) {
                        return areArraysShallowEquals(oldVal, newVal);
                    } else if (_.isPlainObject(oldVal) && _.isPlainObject(newVal)) {
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
