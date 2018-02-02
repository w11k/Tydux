import {Observable} from "rxjs";
import {takeUntil} from "rxjs/operators";

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
        return this.observable.first();
    }

    toPromise() {
        return this.observable.toPromise();
    }

}
