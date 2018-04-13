/*
import {Observable} from "rxjs/Observable";
import {combineLatest} from "rxjs/observable/combineLatest";
import {debounceTime, map} from "rxjs/operators";

export function selectMany<T1, T2, T3, R>(uo1: Observable<T1>,
                                          uo2: Observable<T2>,
                                          mapFn: (v1: T1, v2: T2) => R): Observable<R>;

export function selectMany<T1, T2, T3, R>(uo1: Observable<T1>,
                                          uo2: Observable<T2>,
                                          uo3: Observable<T3>,
                                          mapFn: (v1: T1, v2: T2, v3: T3) => R): Observable<R>;

export function selectMany<T1, T2, T3, T4, R>(uo1: Observable<T1>,
                                              uo2: Observable<T2>,
                                              uo3: Observable<T3>,
                                              uo4: Observable<T4>,
                                              mapFn: (v1: T1, v2: T2, v3: T3, v4: T4) => R): Observable<R>;

export function selectMany<T1, T2, T3, T4, T5, R>(uo1: Observable<T1>,
                                                  uo2: Observable<T2>,
                                                  uo3: Observable<T3>,
                                                  uo4: Observable<T4>,
                                                  uo5: Observable<T5>,
                                                  mapFn: (v1: T1, v2: T2, v3: T3, v4: T4, v5: T5) => R): Observable<R>;

export function selectMany<T1, T2, T3, T4, T5, T6, R>(uo1: Observable<T1>,
                                                      uo2: Observable<T2>,
                                                      uo3: Observable<T3>,
                                                      uo4: Observable<T4>,
                                                      uo5: Observable<T5>,
                                                      uo6: Observable<T6>,
                                                      mapFn: (v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R): Observable<R>;

export function selectMany<R>(...args: Array<Observable<any> | ((...values: Array<any>) => R)>): Observable<R> {

    let mapFn: (...values: any[]) => R = args.pop() as any;

    args = args.map((a: any) => a.asObservable());

    return combineLatest.apply(undefined, [...args])
        .pipe(
            debounceTime(0),
            map((args: any[]) => mapFn(...args))
        );
}
*/
