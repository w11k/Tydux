import {Observable, Operator} from "rxjs";
import {OperatorFunction} from "rxjs/internal/types";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {isPlainObject} from "./lodash/lodash";
import {areArraysShallowEquals, arePlainObjectsShallowEquals, isNil} from "./utils";


export function selectToObservableSelection<S, R>(input$: Observable<S>,
                                                  selector?: (state: Readonly<S>) => R) {
    const output$ = input$
        .pipe(
            map(stateChange => {
                return !isNil(selector) ? selector(stateChange) : stateChange as any;
            }),
            distinctUntilChanged((oldVal, newVal) => {
                if (Array.isArray(oldVal) && Array.isArray(newVal)) {
                    return areArraysShallowEquals(oldVal, newVal);
                } else if (isPlainObject(newVal) && isPlainObject(newVal)) {
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
            filter(val => !isNil(val)),
            map(val => val!)
        );

    return new ObservableSelection(output$);
}

export class ObservableSelection<T> {

    constructor(readonly input$: Observable<T>) {
    }

    pipe(): ObservableSelection<T>;
    pipe<A>(op1: OperatorFunction<T, A>): ObservableSelection<A>;
    pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): ObservableSelection<B>;
    pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): ObservableSelection<C>;
    pipe<A, B, C, D>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): ObservableSelection<D>;
    pipe<A, B, C, D, E>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): ObservableSelection<E>;
    pipe<A, B, C, D, E, F>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): ObservableSelection<F>;
    pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): ObservableSelection<G>;
    pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): ObservableSelection<H>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): ObservableSelection<I>;

    pipe<R>(...operations: OperatorFunction<T, R>[]): ObservableSelection<R> {
        return new ObservableSelection(this.input$.pipe(...operations));
    }

    bounded(operator: Operator<T, T>): Observable<T> {
        return this.input$.lift(operator);
    }

    unbounded(): Observable<T> {
        return this.input$;
    }

}
