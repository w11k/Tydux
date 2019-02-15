import { TestBed } from '@angular/core/testing';

import { TodoService } from './todo.service';
import { TyduxStore } from '@w11k/tydux';

describe('TodoService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: TyduxStore, useValue: {} }
    ]
  }));

  it('should be created', () => {
    const service: TodoService = TestBed.get(TodoService);
    expect(service).toBeTruthy();
  });
});
