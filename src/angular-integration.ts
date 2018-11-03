import {Observable, Operator, Subject, Subscriber} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {operatorFactory} from "./utils";

export type OnDestroyLike = {
    ngOnDestroy(): void;
};

export function componentDestroyed(component: OnDestroyLike): Observable<true> {
    const oldNgOnDestroy = component.ngOnDestroy;
    const stop$ = new Subject<true>();
    component.ngOnDestroy = function () {
        if (oldNgOnDestroy !== undefined && oldNgOnDestroy !== null) {
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

// export function provideTydux<S>(initialState: S, enhancer?: StoreEnhancer<any>): { provide: typeof TyduxStore, useValue: TyduxStore<S> } {
//     return {
//         provide: TyduxStore,
//         useValue: createTyduxStore(initialState, enhancer)
//     };
// }
//
// export type Provider = typeof TyduxReducerBridge | { provide: any, useFactory: Function, deps: any[] };
//
// export const STORE = "TyduxStoreFactoryToken";
//
// export function provideTyduxWithStoreFactory(storeFactory: (bridge: TyduxReducerBridge) => Store, storeToken: any = STORE): Provider[] {
//     return [
//         TyduxReducerBridge,
//         {
//             provide: storeToken,
//             useFactory: storeFactory,
//             deps: [TyduxReducerBridge]
//         },
//         {
//             provide: TyduxStore,
//             useFactory: (bridge: TyduxReducerBridge, store: Store) => {
//                 return bridge.connectStore(store);
//             },
//             deps: [TyduxReducerBridge, storeToken]
//         },
//     ]
// }
//






