import {take} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Subject} from "rxjs/Subject";
import {Mutator} from "./mutators";
import {MountedDeferredMutator, Store} from "./Store";


export class DeferredMutator<M extends Mutator<any>> {

    private mutatorHolder: Subject<M> = new ReplaySubject(1);

    constructor(private readonly resolver: () => Promise<M>) {
    }

    mount(instrument: (instance: any) => void): MountedDeferredMutator<M> {
        let resolved = false;
        return {
            resolve: () => {
                if (!resolved) {
                    this.resolver().then(stateMutator => {
                        resolved = true;
                        instrument(stateMutator);
                        this.mutatorHolder.next(stateMutator);
                    });
                }
                return this.mutatorHolder.pipe(take(1)).toPromise();
            },
            get: () => {
                return this.mutatorHolder.pipe(take(1)).toPromise();
            },
            // getView: () => {
            //     const view = new Store();
            // }
        };
    }
}

export function defer<M extends Mutator<any>>(resolver: () => Promise<M>) {
    return new DeferredMutator<M>(resolver);
}
