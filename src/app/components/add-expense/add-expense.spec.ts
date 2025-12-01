// Spec summary: verifies AddExpenseComponent form initialization, total calculation,
// new vs edit submit flows, and category add/validation logic using mocked services.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddExpenseComponent } from './add-expense';
import { ExpenseService } from '../../services/expense';
import { CategoryService } from '../../services/category';

describe('AddExpenseComponent', () => {
  let component: AddExpenseComponent;
  let fixture: ComponentFixture<AddExpenseComponent>;
  // Spies for services and router to isolate component behavior from real dependencies
  let expenseServiceSpy: jasmine.SpyObj<ExpenseService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // Simple stub for ActivatedRoute so we can control route params (new vs edit mode)
  const activatedRouteStub: Partial<ActivatedRoute> = {
    snapshot: { params: {} } as any,
    params: of({})
  };

  beforeEach(async () => {
    // Configure spies with only the methods used by the component
    expenseServiceSpy = jasmine.createSpyObj<ExpenseService>('ExpenseService', [
      'addExpense',
      'updateExpense',
      'getExpenseById'
    ]);

    categoryServiceSpy = jasmine.createSpyObj<CategoryService>('CategoryService', [
      'getExpenseCategories',
      'getEarningCategories',
      'addExpenseCategory',
      'addEarningCategory'
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // Provide simple observable data for categories so form can initialize
    categoryServiceSpy.getExpenseCategories.and.returnValue(of(['Food', 'Transport']));
    categoryServiceSpy.getEarningCategories.and.returnValue(of(['Salary']));

    await TestBed.configureTestingModule({
      imports: [AddExpenseComponent, NoopAnimationsModule],
      providers: [
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Basic sanity check to ensure the component bootstraps with the testing module
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Form should be built with expected initial values
  it('should initialize form with default values', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('type')?.value).toBe('expense');
    expect(component.form.get('quantity')?.value).toBe(1);
    expect(component.form.get('title')?.value).toBe('');
  });

  // Explicitly verifies the calculateTotal helper used by quantity/price valueChanges
  it('should calculate total when quantity or price changes', () => {
    component.form.get('quantity')?.setValue(2);
    component.form.get('price')?.setValue(50);

    component.calculateTotal();

    expect(component.form.get('total')?.value).toBe(100);
  });

  // Guard: invalid form should not trigger service calls
  it('should not submit when form is invalid', () => {
    component.form.get('title')?.setValue('');

    component.submit();

    expect(expenseServiceSpy.addExpense).not.toHaveBeenCalled();
    expect(component.submitError).toBeTruthy();
  });

  // New transaction path: no id in route, should call addExpense
  it('should call addExpense and navigate on successful submit for new expense', () => {
    (activatedRouteStub.snapshot as any).params = {};
    expenseServiceSpy.addExpense.and.returnValue(of({} as any));

    component.form.patchValue({
      type: 'expense',
      title: 'Test Expense',
      category: 'Food',
      quantity: 2,
      unit: 'pcs',
      price: 50,
      date: '2024-01-01'
    });

    component.submit();

    expect(expenseServiceSpy.addExpense).toHaveBeenCalled();
    expect(component.submitting).toBeFalse();
    expect(component.successMessage).toContain('added');
  });

  // Edit path: when route contains an id we should call updateExpense with that id
  it('should call updateExpense when route has id', () => {
    (activatedRouteStub.snapshot as any).params = { id: 'txn_1' };
    expenseServiceSpy.updateExpense.and.returnValue(of({} as any));

    component.form.patchValue({
      type: 'expense',
      title: 'Updated Expense',
      category: 'Food',
      quantity: 1,
      unit: 'pcs',
      price: 100,
      date: '2024-01-01'
    });

    component.submit();

    expect(expenseServiceSpy.updateExpense).toHaveBeenCalledWith('txn_1', jasmine.any(Object));
  });

  // Validation: empty category name should be rejected before hitting the service
  it('should not add new category when name is empty', () => {
    component.newCategoryInput = ' ';
    component.addNewCategory();
    expect(component.addCategoryError).toBeTruthy();
    expect(categoryServiceSpy.addExpenseCategory).not.toHaveBeenCalled();
  });

  // Happy path: adding a valid expense category updates list and success message
  it('should add new expense category successfully', () => {
    component.transactionType = 'expense';
    component.newCategoryInput = 'New Category';
    categoryServiceSpy.addExpenseCategory.and.returnValue(of(true));

    component.addNewCategory();

    expect(categoryServiceSpy.addExpenseCategory).toHaveBeenCalledWith('New Category', component.newCategoryColor);
    expect(component.allCategories).toContain('New Category');
    expect(component.addCategorySuccess).toContain('Category added successfully');
  });
});
