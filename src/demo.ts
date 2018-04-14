import {StateMutators, Store} from "./Store";

class PersonState {
    personList: string[] = [];
}

class PersonStateMutators extends StateMutators<PersonState> {
    addPerson(name: string) {
        this.state = {
            ...this.state,
            personList: [...this.state.personList, name]
        };
    }
}

class CityState {
    cityList: string[] = [];
}

class CityStateMutators extends StateMutators<CityState> {
    addCity(name: string) {
        this.state = {
            ...this.state,
            cityList: [...this.state.cityList, name]
        };
    }
}

// class ReducerStateGroup<T> extends StateMutators<T> {
//     constructor(private readonly reducer: (action: Action, state: T) => T) {
//         super({});
//     }
//
//     dispatch(action: Action) {
//         this.state = this.reducer(action, this.state);
//     }
// }

const storeStructure = {
    humans: {
        persons: new PersonStateMutators(new PersonState())
    },
    other: {
        earth: {
            // redux: new ReducerStateGroup(fn),
            city: new CityStateMutators(new CityState())
        }
    },
    // admin: lazyByRoute(route, XXX, async () => {
    //     const mod = await import("./admin/admin.module");
    //     return mod.adminStoreStructure;
    // })
};

const store = Store.create(storeStructure);
// store.getChild(s => s.other.earth).mutate.city.addCity("Rom");
// let x = store.getChild(s => s.other.earth).state.city.cityList.length;


store.unbounded()
    .select(s => {
        return {
            cities: s.other.earth.city.cityList,
            persons: s.humans.persons.personList
        };
    })
    .subscribe(list => console.log("list", list.persons));
