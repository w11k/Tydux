import { TestBed } from '@angular/core/testing';

import { TodoService } from './todo.service';
import { TyduxModule } from '@w11k/tydux-angular';

describe('TodoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TyduxModule.forRootWithoutConfig()
      ]
    });
  });

  it('should be created', () => {
    const service: TodoService = TestBed.get(TodoService);
    expect(service).toBeTruthy();
  });
});
