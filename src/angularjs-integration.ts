// import {Observable, Observer, Operator, Subscriber} from "rxjs";
// import {isNil} from "./utils";
//
//
// function runInScopeDigest(scope: AngularJS1ScopeLike, fn: () => void) {
//     if (!isNil(scope)
//         && !isNil(scope.$root)
//         && scope.$root.$$phase !== "$apply"
//         && scope.$root.$$phase !== "$digest") {
//         scope.$apply(fn);
//     } else {
//         fn();
//     }
// }
//
// export function scoped<T>(scope: AngularJS1ScopeLike): Operator<T, T> {
//     return {
//         call: <T>(subscriber: Subscriber<T>, source: Observable<T>) => {
//             const subscription = source.subscribe(
//                 value => {
//                     runInScopeDigest(scope, () => subscriber.next(value));
//                 },
//                 exception => {
//                     unsubDestroy();
//                     runInScopeDigest(scope, () => subscriber.error(exception));
//                 },
//                 () => {
//                     unsubDestroy();
//                     runInScopeDigest(scope, () => subscriber.complete());
//                 }
//             );
//
//             const unsubDestroy = scope.$on("$destroy", () => {
//                 subscriber.complete();
//                 subscription.unsubscribe();
//             });
//
//             return () => {
//                 unsubDestroy();
//                 subscriber.complete();
//                 subscription.unsubscribe();
//             };
//         }
//     };
// }
//
// export function scopeDestroyed(scope: { $on: (event: string, callback: () => void) => void }): Observable<true> {
//     return Observable.create((s: Observer<true>) => {
//         scope.$on("$destroy", () => {
//             s.next(true);
//             s.complete();
//         });
//     });
// }
//
// export interface IAngularEvent {
//
//     targetScope: AngularJS1ScopeLike;
//
//     currentScope: AngularJS1ScopeLike;
//
//     name: string;
//
//     stopPropagation?(): void;
//
//     preventDefault(): void;
//
//     defaultPrevented: boolean;
// }
//
// export interface AngularJS1ScopeLike {
//
//     $root?: AngularJS1ScopeLike;
//
//     $$phase: any;
//
//     $apply(exp: (scope: AngularJS1ScopeLike) => any): any;
//
//     $on(name: string, listener: (event: IAngularEvent, ...args: any[]) => any): () => void;
//
// }
