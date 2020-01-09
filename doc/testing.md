#Testing

Writing tests can sometimes be difficult. We try to explain how to write tests for
typical use cases.
If a facade is to be completely replaced as a dependency, the mock class can inherit
from the FacadeMock class.

```typescript
// the mock
export class TodoServiceMock extends FacadeMock<TodoState> implements Partial<TodoService> {
  constructor() {
    super(new TodoState());
  }
  async toggleDoneStateOf(todo: ToDo) {}
  async saveToDo(toDo: ToDo) {}
}

// unit under test
export class ToDoView {
  todos: ToDo[]
  constructor(readonly service: TodoService) {
    service.select(it => it.todos)
      .subscribe(ts => this.todos = ts);
  }
}

//test
it("should receive update via select", () => {
  const mock: TodoServiceMock = new TodoServiceMock();
  const underTest = new ToDoView(mock);
  expect(underTest.todos).toEqual(new TodoState().todos);
  const emptyListState: TodoState = {todos: []};
  mock.state = emptyListState;
  expect(underTest.todos).toEqual([]);
});
```

If you want to test the commands of a facade, the function createTestFacade helps.

```typescript
it("Testing CommandClass", async () => {
  class TestCommands extends Commands<{ n1: number }> {
      mut1() {
          this.state.n1 = 1;
      }
  }

  const facade = createTestFacade(new TestCommands(), {n1: 0});
  facade.commands.mut1();

  // resolves when Redux state becomes stable
  await untilNoBufferedStateChanges(facade);
  expect(facade.state).toEqual({n1: 1});
});
```

If you use Angular you can provide your mock to the facades by using the 
Angular Dependency Injection.

```typescript
TestBed.configureTestingModule({
  declarations: [
    TodoListContextComponent, // unit under test, uses TodoService
  ],
  providers: [
    TodoServiceMock,
    {provide: TodoService, useExisting: TodoServiceMock}
  ]
})
```
