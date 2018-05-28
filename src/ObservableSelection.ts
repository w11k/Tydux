import * as _ from "lodash";
import {Observable, Operator} from "rxjs";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {areArraysShallowEquals, arePlainObjectsShallowEquals} from "./utils";


export function selectToObservableSelection<S, R>(input$: Observable<S>,
                                                  selector?: (state: Readonly<S>) => R) {
    const output$ = input$
        .pipe(
            map(stateChange => {
                return !_.isNil(selector) ? selector(stateChange) : stateChange as any;
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

    return new ObservableSelection(output$);
}


export function selectNonNilToObervableSelection<S, R>(input$: Observable<S>,
                                                       selector: (state: Readonly<S>) => R | null | undefined) {
    const output$ = selectToObservableSelection(input$, selector)
        .unbounded()
        .pipe(
            filter(val => !_.isNil(val)),
            map(val => val!)
        );

    return new ObservableSelection(output$);
}

export class ObservableSelection<S> {

    constructor(readonly input$: Observable<S>) {
    }

    bounded(operator: Operator<S, S>): Observable<S> {
        return this.input$.lift(operator);
    }

    unbounded(): Observable<S> {
        return this.input$;
    }

}
