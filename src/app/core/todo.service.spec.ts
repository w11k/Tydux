import { TestBed } from '@angular/core/testing';

import { TodoService } from './todo.service';
import { TyduxModule } from '../../../projects/w11k/tydux-angular/src/public_api';

describe('TodoService', () => {
  beforeEach(() => {
    console.log(TyduxModule);
    TestBed.configureTestingModule({
      imports: [
        TyduxModule.forRootWithoutConfig()
      ]
    })
  });

  it('should be created', () => {
    const service: TodoService = TestBed.get(TodoService);
    expect(service).toBeTruthy();
  });
});
