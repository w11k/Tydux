import * as _ from "lodash";
import {enableDevelopmentMode} from "../../../devTools";
import {createStore, Mutators, Store} from "../../../Store";
import "./index.html";

enableDevelopmentMode();

export class Todo {
    constructor(public description: string) {
    }
}

export class TodoState {

    todos = [
        new Todo("Eins"),
        new Todo("Zwei")
    ];

}

export class TodoMutators extends Mutators<TodoState> {

    async addTodo(todoName: string) {
        this.state.todos = [
            ...this.state.todos,
            new Todo(todoName)
        ];
    }

    reverse() {
        this.state.todos = _.reverse(_.slice(this.state.todos));
    }

}

export abstract class TodoStore extends Store<TodoMutators, TodoState> {
}

const store: TodoStore = createStore("todo", new TodoMutators(), new TodoState());

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button id="addTodo">add todo</button>
            <button id="reverse">reverse</button>
            <ol>
                ${store.state.todos.map(t => `<li>${t.description}</li>`).join("")}
            </ol>
        </div>
        `;

    document.getElementById("addTodo")!.onclick = () => store.dispatch.addTodo("" + Date.now());
    document.getElementById("reverse")!.onclick = () => store.dispatch.reverse();
};

store.dispatch.addTodo("Philipp");

store.select()
        .subscribe(() => {
            renderApp();
        });
