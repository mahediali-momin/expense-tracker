import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ExpenseService, Expense } from '../../services/expense';
import { CategoryService } from '../../services/category';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.html',
  styleUrls: ['./add-expense.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MatDatepickerModule, MatInputModule, MatFormFieldModule, MatNativeDateModule, MatButtonModule, MatIconModule],
  animations: [
    trigger('pageSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class AddExpenseComponent implements OnInit {
  @ViewChild('titleInput') titleInput!: ElementRef;

  form!: FormGroup;
  allCategories: string[] = [];
  customCategories: { [key: string]: string[] } = {};
  transactionType: 'expense' | 'earning' = 'expense';

  successMessage = '';
  submitError = '';
  showAddCategoryForm = false;
  newCategoryInput = '';
  newCategoryColor = '#3b82f6';
  addCategoryError = '';
  addCategorySuccess = '';
  addingCategory = false;
  submitting = false;
  submitLabel = 'Add Expense';

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadEditingExpense();
  }

  initForm(): void {
    this.form = this.fb.group({
      type: ['expense', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      total: [{ value: 0, disabled: true }]
    });

    // Calculate total when quantity or price changes
    this.form.get('quantity')?.valueChanges.subscribe(() => this.calculateTotal());
    this.form.get('price')?.valueChanges.subscribe(() => this.calculateTotal());

    this.form.get('type')?.valueChanges.subscribe(type => {
      this.transactionType = type;
      this.loadCategories();
    });
  }

  calculateTotal(): void {
    const quantity = this.form.get('quantity')?.value || 0;
    const price = this.form.get('price')?.value || 0;
    const total = quantity * price;
    this.form.get('total')?.setValue(total, { emitEvent: false });
  }

  loadCategories(): void {
    const type = this.transactionType === 'expense' ? 'expense' : 'earning';
    if (type === 'expense') {
      this.categoryService.getExpenseCategories().subscribe(categories => {
        this.allCategories = categories;
      });
    } else {
      this.categoryService.getEarningCategories().subscribe(categories => {
        this.allCategories = categories;
      });
    }
  }

  loadEditingExpense(): void {
    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.expenseService.getExpenseById(id).subscribe(expense => {
          if (expense) {
            this.form.patchValue({
              type: expense.type || 'expense',
              title: expense.title,
              category: expense.category,
              quantity: expense.quantity || 1,
              unit: expense.unit || '',
              price: expense.price,
              date: expense.date
            });
            this.transactionType = expense.type || 'expense';
            this.submitLabel = 'Update Expense';
          }
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.submitError = 'Please fill all required fields correctly';
      return;
    }

    this.submitting = true;
    const formValue = this.form.value;
    const expense: Expense = {
      id: 'transaction_' + Date.now(),
      title: formValue.title,
      price: formValue.price,
      date: formValue.date,
      category: formValue.category,
      type: formValue.type,
      quantity: formValue.quantity,
      unit: formValue.unit,
      total: formValue.quantity * formValue.price
    };

    try {
      const routeId = this.activatedRoute.snapshot.params['id'];
      if (routeId) {
        this.expenseService.updateExpense(routeId, expense).subscribe(() => {
          this.submitting = false;
          this.successMessage = 'Expense updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/list']);
          }, 500);
        }, (error) => {
          this.submitting = false;
          this.submitError = 'Failed to save expense. Please try again.';
        });
      } else {
        expense.id = 'transaction_' + Date.now();
        this.expenseService.addExpense(expense).subscribe(() => {
          this.submitting = false;
          this.successMessage = 'Expense added successfully!';
          setTimeout(() => {
            this.router.navigate(['/list']);
          }, 500);
        }, (error) => {
          this.submitting = false;
          this.submitError = 'Failed to save expense. Please try again.';
        });
      }
    } catch (error) {
      this.submitting = false;
      this.submitError = 'Failed to save expense. Please try again.';
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minLength']) return `Minimum ${field.errors['minLength'].requiredLength} characters required`;
      if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}`;
    }
    return null;
  }

  getAvailableCategories(): string[] {
    return this.allCategories;
  }

  toggleAddCategoryForm(): void {
    this.showAddCategoryForm = !this.showAddCategoryForm;
    if (this.showAddCategoryForm) {
      setTimeout(() => this.titleInput?.nativeElement?.focus(), 0);
    }
  }

  addNewCategory(): void {
    if (!this.newCategoryInput.trim()) {
      this.addCategoryError = 'Category name cannot be empty';
      return;
    }

    this.addingCategory = true;
    this.addCategoryError = '';
    this.addCategorySuccess = '';

    try {
      const isExpense = this.transactionType === 'expense';
      const observable = isExpense
        ? this.categoryService.addExpenseCategory(this.newCategoryInput.trim(), this.newCategoryColor)
        : this.categoryService.addEarningCategory(this.newCategoryInput.trim(), this.newCategoryColor);

      observable.subscribe(success => {
        if (success) {
          this.allCategories.push(this.newCategoryInput.trim());
          this.newCategoryInput = '';
          this.newCategoryColor = '#3b82f6';
          this.addCategorySuccess = 'Category added successfully!';
          setTimeout(() => {
            this.showAddCategoryForm = false;
            this.addCategorySuccess = '';
          }, 1500);
        } else {
          this.addCategoryError = 'Failed to add category. It might already exist.';
        }
        this.addingCategory = false;
      });
    } catch (error) {
      this.addCategoryError = 'Failed to add category. It might already exist.';
      this.addingCategory = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/list']);
  }
}
