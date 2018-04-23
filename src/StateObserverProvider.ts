import {Operator} from "rxjs/Operator";
import {StateObserver} from "./StateObserver";

export interface StateObserverProvider<S> {

    bounded(operator: Operator<S, S>): StateObserver<S>;

    unbounded(): StateObserver<S>;

}
