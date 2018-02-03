import {Observable} from "rxjs";
import {first, takeUntil} from "rxjs/operators";
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

    toPromise() {
        return this.observable.toPromise();
    }

    boundToAngularJS1Scope($scope: AngularJS1ScopeLike) {
        return this.observable.lift(angularJs1Scoped($scope));
    }

}
