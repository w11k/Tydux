import { TestBed } from '@angular/core/testing';
import { removeGlobalStore, TyduxStore } from '@w11k/tydux';

import { TodoService } from './todo.service';
import { provideTydux } from '@w11k/tydux-angular';

describe('TodoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideTydux(),
    });
    TestBed.inject(TyduxStore);
  });

  afterEach(() => removeGlobalStore());

  it('should be created', () => {
    const service = TestBed.inject(TodoService);
    expect(service).toBeTruthy();
  });
});
