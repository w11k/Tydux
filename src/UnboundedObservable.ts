import "rxjs/add/observable/of";
import {Observable} from "rxjs/Observable";
import {combineLatest} from "rxjs/observable/combineLatest";
import {debounceTime, first, share, takeUntil} from "rxjs/operators";
import {OnDestroyLike, untilComponentDestroyed} from "./angular-integration";
import {angularJs1Scoped, AngularJS1ScopeLike} from "./angularjs1-integration";

export class UnboundedObservable<T> {

    constructor(private readonly observable: Observable<T>) {
    }

    unbounded() {
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

    share() {
        return new UnboundedObservable(this.observable.pipe(
            share()
        ));
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

    let mapFn = args.pop();
    args = args.map((a: any) => a.unbounded());

    const combined = combineLatest.apply(undefined, [...args, mapFn])
        .pipe(
            debounceTime(0)
        );

    return new UnboundedObservable<R>(combined);
}

