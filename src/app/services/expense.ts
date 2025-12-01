import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Transaction {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  date: string;
  type: 'expense' | 'earning';  // NEW: expense or earning
  createdAt?: string;
  notes?: string
}

// For backward compatibility
export interface Expense extends Transaction { }

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly STORAGE_KEY = 'transactions_data';

  constructor() { }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all transactions from localStorage (both expenses and earnings)
   */
  getExpenses(): Observable<Transaction[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const transactions = data ? JSON.parse(data) : [];
      // Sort by date descending (newest first)
      transactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return of(transactions);
    } catch (error) {
      console.error('Error reading transactions from localStorage', error);
      return of([]);
    }
  }

  /**
   * Get only expenses
   */
  getOnlyExpenses(): Observable<Transaction[]> {
    return new Observable(observer => {
      this.getExpenses().subscribe(transactions => {
        observer.next(transactions.filter(t => t.type === 'expense'));
        observer.complete();
      });
    });
  }

  /**
   * Get only earnings
   */
  getOnlyEarnings(): Observable<Transaction[]> {
    return new Observable(observer => {
      this.getExpenses().subscribe(transactions => {
        observer.next(transactions.filter(t => t.type === 'earning'));
        observer.complete();
      });
    });
  }

  /**
   * Add new transaction to localStorage
   */
  addExpense(data: any): Observable<Transaction> {
    try {
      const transactions = this.getAllTransactionsSync();
      const newTransaction: Transaction = {
        id: this.generateId(),
        ...data,
        type: data.type || 'expense',  // Default to expense
        createdAt: new Date().toISOString()
      };
      transactions.push(newTransaction);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
      return of(newTransaction);
    } catch (error) {
      console.error('Error adding transaction', error);
      throw error;
    }
  }

  /**
   * Delete transaction from localStorage
   */
  deleteExpense(id: string): Observable<void> {
    try {
      const transactions = this.getAllTransactionsSync();
      const filtered = transactions.filter((t: Transaction) => t.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return of(void 0);
    } catch (error) {
      console.error('Error deleting transaction', error);
      throw error;
    }
  }

  /**
   * Update transaction in localStorage
   */
  updateExpense(id: string, data: any): Observable<Transaction> {
    try {
      const transactions = this.getAllTransactionsSync();
      const index = transactions.findIndex((t: Transaction) => t.id === id);
      if (index === -1) throw new Error('Transaction not found');
      transactions[index] = { ...transactions[index], ...data };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
      return of(transactions[index]);
    } catch (error) {
      console.error('Error updating transaction', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  getExpenseById(id: string): Observable<Transaction | null> {
    try {
      const transactions = this.getAllTransactionsSync();
      const transaction = transactions.find((t: Transaction) => t.id === id) || null;
      return of(transaction);
    } catch (error) {
      console.error('Error getting transaction', error);
      return of(null);
    }
  }

  /**
   * Get all transactions synchronously
   */
  private getAllTransactionsSync(): Transaction[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading transactions', error);
      return [];
    }
  }

  /**
   * Clear all expenses (for testing)
   */
  clearAllExpenses(): Observable<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return of(void 0);
    } catch (error) {
      console.error('Error clearing expenses', error);
      throw error;
    }
  }

  /**
   * Get total expense amount
   */
  getTotalExpense(): Observable<number> {
    return new Observable(observer => {
      this.getOnlyExpenses().subscribe(expenses => {
        const total = expenses.reduce((sum: number, exp: Transaction) => sum + exp.total, 0);
        observer.next(total);
        observer.complete();
      });
    });
  }

  /**
   * Get total earning amount
   */
  getTotalEarning(): Observable<number> {
    return new Observable(observer => {
      this.getOnlyEarnings().subscribe(earnings => {
        const total = earnings.reduce((sum: number, earning: Transaction) => sum + earning.total, 0);
        observer.next(total);
        observer.complete();
      });
    });
  }

  /**
   * Get net amount (earnings - expenses)
   */
  getNetAmount(): Observable<number> {
    return new Observable(observer => {
      this.getTotalEarning().subscribe(earnings => {
        this.getTotalExpense().subscribe(expenses => {
          observer.next(earnings - expenses);
          observer.complete();
        });
      });
    });
  }

  /**
   * Get expenses grouped by category with totals
   */
  getExpensesByCategory(): Observable<{ category: string; total: number; count: number }[]> {
    return new Observable(observer => {
      this.getOnlyExpenses().subscribe(expenses => {
        const categoryMap: { [key: string]: { total: number; count: number } } = {};

        expenses.forEach((expense: Transaction) => {
          if (!categoryMap[expense.category]) {
            categoryMap[expense.category] = { total: 0, count: 0 };
          }
          categoryMap[expense.category].total += expense.total;
          categoryMap[expense.category].count += 1;
        });

        const result = Object.entries(categoryMap).map(([category, data]) => ({
          category,
          ...data
        }));

        observer.next(result);
        observer.complete();
      });
    });
  }

  /**
   * Get earnings grouped by category with totals
   */
  getEarningsByCategory(): Observable<{ category: string; total: number; count: number }[]> {
    return new Observable(observer => {
      this.getOnlyEarnings().subscribe(earnings => {
        const categoryMap: { [key: string]: { total: number; count: number } } = {};

        earnings.forEach((earning: Transaction) => {
          if (!categoryMap[earning.category]) {
            categoryMap[earning.category] = { total: 0, count: 0 };
          }
          categoryMap[earning.category].total += earning.total;
          categoryMap[earning.category].count += 1;
        });

        const result = Object.entries(categoryMap).map(([category, data]) => ({
          category,
          ...data
        }));

        observer.next(result);
        observer.complete();
      });
    });
  }
}