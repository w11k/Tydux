import {Observable} from "rxjs/Observable";
import {map} from "rxjs/operators/map";
import {EntityState} from "./Entity.store";
import {StateObserver} from "./StateObserver";

export class EntityStoreObserver<T> extends StateObserver<EntityState<T>> {

    selectById(id: string) {
        return this.select(s => s.entities[id]);
    }

    selectAll(): Observable<T[]> {
        return this.select()
            .pipe(
                map(state => {
                    return state.ids.map((id) => state.entities[id]);
                })
            );
    }

}
