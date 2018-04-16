import {take} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Subject} from "rxjs/Subject";
import {StateMutators} from "./mutators";


export class DeferredStateMutators<M extends StateMutators<any>> {

    private stateMutator: Subject<M> = new ReplaySubject(1);

    constructor(private readonly resolver: () => Promise<M>) {
    }

    mount(instrument: (instance: any) => void)/*: MountedDeferredStateMutators<M>*/ {
        return {
            resolve: () => {
                this.resolver().then(stateMutator => {
                    instrument(stateMutator);
                    this.stateMutator.next(stateMutator);
                });
            },
            get: () => {
                return this.stateMutator.pipe(take(1)).toPromise();
            }
        };
    }
}

export function defer<M extends StateMutators<any>>(resolver: () => Promise<M>) {
    return new DeferredStateMutators<M>(resolver);
}
