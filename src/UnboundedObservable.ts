import {Observable} from "rxjs/Observable";


export class UnboundedObservable<T> {

    constructor(private readonly observable: Observable<T>) {
    }

    pipe<R>(operatorFunction: (source: Observable<T>) => Observable<R>) {
        let transformed: Observable<R> = this.observable.pipe(operatorFunction);
        return new UnboundedObservable(transformed);
    }

    unbounded() {
        return this.observable;
    }

    takeUntil(notifier: Observable<any>) {
        return this.observable.takeUntil(notifier);
    }

    first() {
        return this.observable.first();
    }

    toPromise() {
        return this.observable.toPromise();
    }

}
