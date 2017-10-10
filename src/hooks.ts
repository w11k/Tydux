
import {Mutators} from "./Store";
import {Observable} from "rxjs/Observable";

export type Hooks<M extends Mutators<any>> = {
  [K in keyof M]: ModifierHook;
};

export interface ModifierHook {
    before: Observable<void>;
    after: Observable<void>;
}
