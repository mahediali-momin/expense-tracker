// Spec summary: verifies ListExpense initialization, filtering (search/date),
// total/net calculations, and navigation/delete/refresh behavior with mocked services.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ListExpense } from './list-expense';
import { ExpenseService, Transaction } from '../../services/expense';
import { CategoryService } from '../../services/category';

describe('ListExpense', () => {
  let component: ListExpense;
  let fixture: ComponentFixture<ListExpense>;
  // Spies to avoid real HTTP/localStorage and routing
  let expenseServiceSpy: jasmine.SpyObj<ExpenseService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // Representative set of expenses/earnings used by most tests
  const mockTransactions: Transaction[] = [
    { id: '1', title: 'Food', category: 'Food', quantity: 1, unit: 'pcs', price: 100, total: 100, date: '2024-01-01', type: 'expense' },
    { id: '2', title: 'Salary', category: 'Salary', quantity: 1, unit: 'month', price: 1000, total: 1000, date: '2024-01-02', type: 'earning' },
    { id: '3', title: 'Transport', category: 'Transport', quantity: 1, unit: 'trip', price: 50, total: 50, date: '2024-01-03', type: 'expense' }
  ];

  beforeEach(async () => {
    // Provide only the methods that ListExpense calls
    expenseServiceSpy = jasmine.createSpyObj<ExpenseService>('ExpenseService', [
      'getExpenses',
      'deleteExpense'
    ]);

    categoryServiceSpy = jasmine.createSpyObj<CategoryService>('CategoryService', [
      'getExpenseCategoriesMetaSync',
      'getEarningCategoriesMetaSync'
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // Minimal ActivatedRoute stub so RouterLink / navigation-related directives can resolve
    const activatedRouteStub: Partial<ActivatedRoute> = {
      snapshot: { params: {} } as any
    };

    // Default observable + sync meta responses for initialization
    expenseServiceSpy.getExpenses.and.returnValue(of(mockTransactions));
    categoryServiceSpy.getExpenseCategoriesMetaSync.and.returnValue([
      { name: 'Food', color: '#ff0000' },
      { name: 'Transport', color: '#00ff00' }
    ] as any);
    categoryServiceSpy.getEarningCategoriesMetaSync.and.returnValue([
      { name: 'Salary', color: '#0000ff' }
    ] as any);

    await TestBed.configureTestingModule({
      imports: [ListExpense, NoopAnimationsModule],
      providers: [
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListExpense);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Sanity check: component instantiates correctly with the testing module
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // On init we expect expenses loaded and categoryColors built from meta
  it('should load expenses and category colors on init', () => {
    expect(expenseServiceSpy.getExpenses).toHaveBeenCalled();
    expect(component.expenses.length).toBe(3);
    expect(component.categoryColors['Food']).toBe('#ff0000');
    expect(component.categoryColors['Salary']).toBe('#0000ff');
  });

  // Search filter should match by title (case-insensitive)
  it('should filter expenses by search term', () => {
    component.searchTerm = 'food';
    const filtered = component.getFilteredExpenses();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Food');
  });

  // Date range filter should restrict to transactions within [start, end]
  it('should filter expenses by date range', () => {
    component.dateRange.setValue({
      start: new Date('2024-01-02'),
      end: new Date('2024-01-03')
    });

    const filtered = component.getFilteredExpenses();
    expect(filtered.length).toBe(2);
    expect(filtered.some(e => e.id === '2')).toBeTrue();
    expect(filtered.some(e => e.id === '3')).toBeTrue();
  });

  // Aggregation helpers should compute totals and net correctly over filtered list
  it('should calculate total expenses, earnings and net amount', () => {
    const totalExpenses = component.getTotalExpenses();
    const totalEarnings = component.getTotalEarnings();
    const net = component.getNetAmount();

    expect(totalExpenses).toBe(150); // 100 + 50
    expect(totalEarnings).toBe(1000);
    expect(net).toBe(850);
  });

  // edit() should delegate to router with the correct route params
  it('should navigate to edit on edit()', () => {
    component.edit('1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/edit', '1']);
  });

  // delete() should call service then reload the list
  it('should call deleteExpense and reload on delete()', () => {
    expenseServiceSpy.deleteExpense.and.returnValue(of(void 0));
    spyOn(component, 'loadExpenses');

    component.delete('1');

    expect(expenseServiceSpy.deleteExpense).toHaveBeenCalledWith('1');
    expect(component.loadExpenses).toHaveBeenCalled();
  });

  // confirmDelete() should ask for confirmation and only delete on OK
  it('should confirm before deleting in confirmDelete()', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'delete');

    component.confirmDelete('1');

    expect(window.confirm).toHaveBeenCalled();
    expect(component.delete).toHaveBeenCalledWith('1');
  });

  // When user cancels the browser confirm() we must not invoke delete()
  it('should not delete if confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component, 'delete');

    component.confirmDelete('1');

    expect(component.delete).not.toHaveBeenCalled();
  });

  // refresh() resets filters and triggers a reload from the service
  it('should refresh filters and reload expenses on refresh()', () => {
    spyOn(component, 'loadExpenses');
    component.searchTerm = 'Food';
    component.dateRange.setValue({ start: new Date('2024-01-01'), end: new Date('2024-01-02') });

    component.refresh();

    expect(component.searchTerm).toBe('');
    expect(component.dateRange.value.start).toBeNull();
    expect(component.dateRange.value.end).toBeNull();
    expect(component.loadExpenses).toHaveBeenCalled();
  });
});
