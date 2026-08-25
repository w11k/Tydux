import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TodoService } from '../core/todo.service';
import { TodoListContextComponent } from './todo-list-context.component';

describe('TodoListContextComponent', () => {
  let component: TodoListContextComponent;
  let fixture: ComponentFixture<TodoListContextComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodoListContextComponent],
      providers: [{
        provide: TodoService,
        useValue: {
          select: jest.fn(() => of([])),
          loadAllTodos: jest.fn(),
          updateTodo: jest.fn(),
        },
      }],
    });
    fixture = TestBed.createComponent(TodoListContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
