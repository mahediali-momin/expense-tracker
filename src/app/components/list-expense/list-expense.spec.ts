import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListExpense } from './list-expense';

describe('ListExpense', () => {
  let component: ListExpense;
  let fixture: ComponentFixture<ListExpense>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListExpense]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListExpense);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
