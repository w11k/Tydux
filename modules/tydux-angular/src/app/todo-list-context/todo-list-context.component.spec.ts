import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoListContextComponent } from './todo-list-context.component';

describe('TodoListContextComponent', () => {
  let component: TodoListContextComponent;
  let fixture: ComponentFixture<TodoListContextComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodoListContextComponent]
    });
    fixture = TestBed.createComponent(TodoListContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
