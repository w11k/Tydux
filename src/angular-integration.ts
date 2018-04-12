import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs/Subject";
import {Subscriber} from "rxjs/Subscriber";
import {operatorFactory} from "./utils";

export type OnDestroyLike = {
    ngOnDestroy(): void;
};

export function componentDestroyed(component: OnDestroyLike): Observable<true> {
    const oldNgOnDestroy = component.ngOnDestroy;
    const stop$ = new Subject<true>();
    component.ngOnDestroy = function () {
        if (oldNgOnDestroy() !== undefined && oldNgOnDestroy() !== null) {
            oldNgOnDestroy.apply(component, arguments);
        }
        stop$.next(true);
        stop$.complete();
    };
    return stop$.asObservable();
}

export function toAngularComponent<T>(component: OnDestroyLike): Operator<T, T> {
    return operatorFactory(
        (subscriber: Subscriber<T>, source: Observable<T>) => {
            const subscription = source
                .pipe(
                    takeUntil(componentDestroyed(component))
                )
                .subscribe(subscriber);

            return () => {
                subscription.unsubscribe();
                subscriber.complete();
            };
        }
    );
}
