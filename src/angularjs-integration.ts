import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {Subscriber} from "rxjs/Subscriber";


function runInScopeDigest(scope: AngularJS1ScopeLike, fn: () => void) {
    if (!_.isNil(scope)
        && !_.isNil(scope.$root)
        && scope.$root.$$phase !== "$apply"
        && scope.$root.$$phase !== "$digest") {
        scope.$apply(fn);
    } else {
        fn();
    }
}

export function toAngularJSScope<T>(scope: AngularJS1ScopeLike): Operator<T, T> {
    return {
        call: <T>(subscriber: Subscriber<T>, source: Observable<T>) => {
            const subscription = source.subscribe(
                value => {
                    runInScopeDigest(scope, () => subscriber.next(value));
                },
                exception => {
                    unsubDestroy();
                    runInScopeDigest(scope, () => subscriber.error(exception));
                },
                () => {
                    unsubDestroy();
                    runInScopeDigest(scope, () => subscriber.complete());
                }
            );

            const unsubDestroy = scope.$on("$destroy", () => {
                subscriber.complete();
                subscription.unsubscribe();
            });

            return () => {
                unsubDestroy();
                subscriber.complete();
                subscription.unsubscribe();
            };
        }
    };
}

export interface IAngularEvent {

    targetScope: AngularJS1ScopeLike;

    currentScope: AngularJS1ScopeLike;

    name: string;

    stopPropagation?(): void;

    preventDefault(): void;

    defaultPrevented: boolean;
}

export interface AngularJS1ScopeLike {

    $root?: AngularJS1ScopeLike;

    $$phase: any;

    $apply(exp: (scope: AngularJS1ScopeLike) => any): any;

    $on(name: string, listener: (event: IAngularEvent, ...args: any[]) => any): () => void;

}
