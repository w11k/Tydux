import {Todo} from ".";

export function createTodoList() {
    return new Promise<Todo[]>(resolve => {
        setTimeout(() => {
            resolve([
                {name: "loaded1"},
                {name: "loaded2"},
            ]);
        }, 500);
    });
}
