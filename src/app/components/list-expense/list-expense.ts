import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseService, Transaction } from '../../services/expense';
import { CategoryService } from '../../services/category';

// Define the date range form group interface
interface DateRangeForm {
  start: FormControl<Date | null>;
  end: FormControl<Date | null>;
}

@Component({
  selector: 'app-list-expense',
  templateUrl: './list-expense.html',
  styleUrls: ['./list-expense.css'],
  standalone: true,
  providers: [
    {
      provide: MAT_DATE_FORMATS, useValue: {
        parse: {
          dateInput: 'MM/DD/YYYY',
        },
        display: {
          dateInput: 'MM/DD/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      }
    },
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
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
export class ListExpense implements OnInit {
  expenses: Transaction[] = [];
  // filters
  searchTerm: string = '';
  dateRange: FormGroup<DateRangeForm>;
  categoryColors: { [key: string]: string } = {};

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder
  ) {
    this.dateRange = this.formBuilder.group<DateRangeForm>({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null)
    });
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.expenseService.getExpenses().subscribe({
      next: (expenses: Transaction[]) => {
        this.expenses = expenses;
        // build category color map from CategoryService
        try {
          const expenseMetas = this.categoryService.getExpenseCategoriesMetaSync() || [];
          const earningMetas = this.categoryService.getEarningCategoriesMetaSync() || [];
          const metas = [...expenseMetas, ...earningMetas];
          this.categoryColors = {};
          metas.forEach((m: { name: string; color?: string }) => {
            this.categoryColors[m.name] = m.color || '#94A3B8';
          });
        } catch (error: unknown) {
          console.error('Error loading category colors:', error);
        }
      },
      error: (error: unknown) => {
        console.error('Error loading expenses:', error);
      }
    });
  }

  delete(id: string): void {
    this.expenseService.deleteExpense(id).subscribe({
      next: () => {
        this.loadExpenses();
      },
      error: (error: unknown) => {
        console.error('Error deleting expense:', error);
      }
    });
  }

  edit(transactionId: string): void {
    this.router.navigate(['/edit', transactionId]);
  }

  confirmDelete(id: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.delete(id);
    }
  }

  onDateRangeChange(): void {
    // Filter logic is handled in getFilteredExpenses()
    this.getFilteredExpenses();
  }

  onSearchChange(): void {
    // Filter logic is handled in getFilteredExpenses()
    this.getFilteredExpenses();
  }

  getNetAmount(): number {
    return this.getTotalEarnings() - this.getTotalExpenses();
  }

  getFilteredExpenses(): Transaction[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    let list = this.expenses;

    // Apply search term filter
    if (term) {
      list = list.filter(e => (e.title || '').toLowerCase().includes(term));
    }

    // Apply date range filter
    const startDate = this.dateRange.value.start;
    const endDate = this.dateRange.value.end;

    if (startDate && endDate) {
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Date.now();

      list = list.filter(e => {
        const expenseDate = new Date(e.date).getTime();
        return (!startDate || expenseDate >= start) &&
          (!endDate || expenseDate <= end);
      });
    }
    return list;
  }

  formatDate(dateStr: string | Date | number): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      // Ensure we always return a string by converting the input to a string
      return String(dateStr);
    }
  }

  getTypeLabel(type: string): string {
    return type === 'earning' ? 'Earning' : 'Expense';
  }

  getTotalExpenses(): number {
    return this.getFilteredExpenses()
      .filter(e => e.type === 'expense' || !e.type)
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  }

  getTotalEarnings(): number {
    return this.getFilteredExpenses()
      .filter(e => e.type === 'earning')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  }

  refresh() {
    this.searchTerm = '';
    this.dateRange.reset();
    this.loadExpenses();
  }
}