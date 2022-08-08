# Tydux Repository

_Tydux Repository_ adds a repository state using `createRepositoryState` with prebuild CRUD operations by extending your Tydux Commands with  
`RepositoryCommands`.
This empowers you to quickly **add/update/delete** data on a normalized state structure.

**The following operations are available:**

- **updateOrPushEntry**: add or update one entry
- **updateOrPushEntries**: add or update multiple entries
- **setPositionOfEntry**: set position of one entry to the start, the end or a specific index of the list
- **setPositionOfEntries**: set position of multiple entries to the start, the end or a specific index of the list
- **patchEntry**: patch one partial entry
- **patchEntries**: patch multiple partial entries
- **removeEntry**: removes one entry
- **removeEntries**: remove multiple entries
- **removeAllEntries**: clear all repository entries

The normalized state can be created like the following:

- **createRepositoryState(idField)**: create an empty repository state
- **createRepositoryState(idField, {})**: create a repository state with an initial value (object)
- **createRepositoryState(idField, [])**: create a repository state with an initial value (array)


## Quick usage

```typescript
class TodoState {
    todos = createRepositoryState<Todo, "id">("id");
}

class TodoCommands extends RepositoryCommands<TodoState> {
    // .... other custom commands
}

class TodoFacade extends Facade<TodoCommands> {
    addOne(todo: Todo) {
        this.commands.updateOrPushEntry("todos", todo);
    }
}

export class TodoService extends TodoFacade {

    constructor() {
        super("todos", new TodoCommands(), new TodoState());
    }

    addTodo() {
        this.addOne({ id: '1', state: true, text: 'foo' });
    }
}
```

(more examples see [repository.test.ts](https://github.com/w11k/Tydux/blob/master/modules/tydux/src/lib/repository.test.ts))
