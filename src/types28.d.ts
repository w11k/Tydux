import {Store} from "./Store";

declare global {

    namespace tydux_types {

        export type ViewTreeState<T> = {
            [K in keyof T]
            : T[K] extends Store<any, infer S> ? S
                : T[K] extends object ? ViewTreeState<T[K]>
                : never;
        };

    }

}
