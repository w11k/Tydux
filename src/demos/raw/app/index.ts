import * as _ from "lodash";
import {createStore, Modifiers} from "../../../Store";
import "./index.html";


class Todo {
    constructor(public description: string) {
    }
}

class TodoState {

    todos = [
        new Todo("Eins"),
        new Todo("Zwei")
    ];

}

class TodoModifiers extends Modifiers<TodoState> {

    addTodo(todoName: string) {
        this.state.todos = [
            ...this.state.todos,
            new Todo(todoName)
        ];
    }

    reverse() {
        this.state.todos = _.reverse(_.slice(this.state.todos));
    }

}

const store = createStore("todo", new TodoModifiers(), new TodoState());


const renderApp = (state: TodoState) => {
    document.body.innerHTML = `
        <div>
            <button id="addTodo">add todo</button>
            <button id="reverse">reverse</button>
            <ol>
                ${state.todos.map(t => `<li>${t.description}</li>`).join("")}
            </ol>
        </div>
        `;

    document.getElementById("addTodo")!.onclick = () => store.dispatch.addTodo("" + Date.now());
    document.getElementById("reverse")!.onclick = () => store.dispatch.reverse();
};

store.select()
        .subscribe(state => {
            renderApp(state);
        });
