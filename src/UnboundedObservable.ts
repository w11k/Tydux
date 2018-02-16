import {Observable} from "rxjs/Observable";
import {combineLatest} from "rxjs/observable/combineLatest";
import {debounceTime, first, map, takeUntil} from "rxjs/operators";
import {OnDestroyLike, untilComponentDestroyed} from "./angular-integration";
import {angularJs1Scoped, AngularJS1ScopeLike} from "./angularjs1-integration";


export type OperatorFunction<T, A> = (p: Observable<T>) => Observable<A>;

export class UnboundedObservable<T> {

    constructor(private readonly observable: Observable<T>) {
    }

    asObservable() {
        return this.observable;
    }

    takeUntil(notifier: Observable<any>) {
        return this.observable.pipe(
            takeUntil(notifier));
    }

    first() {
        return this.observable.pipe(
            first()
        );
    }

    pipe<A>(op1: OperatorFunction<T, A>): UnboundedObservable<A>;
    pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): UnboundedObservable<B>;
    pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): UnboundedObservable<C>;
    pipe<A, B, C, D>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): UnboundedObservable<D>;
    pipe<A, B, C, D, E>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): UnboundedObservable<E>;
    pipe<A, B, C, D, E, F>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): UnboundedObservable<F>;
    pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): UnboundedObservable<G>;
    pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): UnboundedObservable<H>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): UnboundedObservable<I>;

    pipe<A>(...ops: (OperatorFunction<T, A>)[]): UnboundedObservable<any> {
        return new UnboundedObservable(this.observable.pipe.apply(this.observable, ops));
    }

    toPromise() {
        return this.observable.toPromise();
    }

    boundToAngularJSScope($scope: AngularJS1ScopeLike) {
        return this.observable.lift(angularJs1Scoped($scope));
    }

    boundToComponent(hasOnDestroy: OnDestroyLike) {
        return this.observable.pipe(
            untilComponentDestroyed(hasOnDestroy)
        );
    }

}

export function selectMany<T1, T2, T3, R>(uo1: UnboundedObservable<T1>,
                                          uo2: UnboundedObservable<T2>,
                                          mapFn: (v1: T1, v2: T2) => R): UnboundedObservable<R>;

export function selectMany<T1, T2, T3, R>(uo1: UnboundedObservable<T1>,
                                          uo2: UnboundedObservable<T2>,
                                          uo3: UnboundedObservable<T3>,
                                          mapFn: (v1: T1, v2: T2, v3: T3) => R): UnboundedObservable<R>;

export function selectMany<T1, T2, T3, T4, R>(uo1: UnboundedObservable<T1>,
                                              uo2: UnboundedObservable<T2>,
                                              uo3: UnboundedObservable<T3>,
                                              uo4: UnboundedObservable<T4>,
                                              mapFn: (v1: T1, v2: T2, v3: T3, v4: T4) => R): UnboundedObservable<R>;

export function selectMany<T1, T2, T3, T4, T5, R>(uo1: UnboundedObservable<T1>,
                                                  uo2: UnboundedObservable<T2>,
                                                  uo3: UnboundedObservable<T3>,
                                                  uo4: UnboundedObservable<T4>,
                                                  uo5: UnboundedObservable<T5>,
                                                  mapFn: (v1: T1, v2: T2, v3: T3, v4: T4, v5: T5) => R): UnboundedObservable<R>;

export function selectMany<T1, T2, T3, T4, T5, T6, R>(uo1: UnboundedObservable<T1>,
                                                      uo2: UnboundedObservable<T2>,
                                                      uo3: UnboundedObservable<T3>,
                                                      uo4: UnboundedObservable<T4>,
                                                      uo5: UnboundedObservable<T5>,
                                                      uo6: UnboundedObservable<T6>,
                                                      mapFn: (v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R): UnboundedObservable<R>;

export function selectMany<R>(...args: Array<UnboundedObservable<any> | ((...values: Array<any>) => R)>): UnboundedObservable<R> {

    let mapFn: (...values: any[]) => R = args.pop() as any;

    args = args.map((a: any) => a.asObservable());

    const combined = combineLatest.apply(undefined, [...args])
        .pipe(
            debounceTime(0),
            map((args: any[]) => mapFn(...args))
        );

    return new UnboundedObservable<R>(combined);
}

