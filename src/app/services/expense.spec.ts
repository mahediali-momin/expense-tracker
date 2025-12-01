// Spec summary: unit tests for ExpenseService CRUD operations, localStorage
// persistence, partition helpers, and aggregation/grouping methods.
import { TestBed } from '@angular/core/testing';
import { ExpenseService, Transaction } from './expense';

describe('ExpenseService', () => {
  let service: ExpenseService;
  // In-memory map used to fake localStorage so tests remain deterministic
  let localStorageMock: { [key: string]: string | null };

  const STORAGE_KEY = 'transactions_data';

  beforeEach(() => {
    localStorageMock = {};

    // Replace window.localStorage methods with spies backed by localStorageMock
    spyOn(window.localStorage, 'getItem').and.callFake((key: string) => {
      return localStorageMock[key] ?? null;
    });

    spyOn(window.localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    spyOn(window.localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageMock[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseService);
  });

  // Helper to prime our fake storage with a specific transaction list
  function seedTransactions(transactions: Transaction[]) {
    localStorageMock[STORAGE_KEY] = JSON.stringify(transactions);
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // addExpense() should generate a new id, createdAt and persist to storage
  it('should add a new transaction', (done) => {
    seedTransactions([]);

    service.addExpense({
      title: 'Food',
      category: 'Food',
      quantity: 1,
      unit: 'pcs',
      price: 100,
      total: 100,
      date: '2024-01-01',
      type: 'expense'
    }).subscribe(tx => {
      expect(tx.id).toBeTruthy();
      expect(tx.createdAt).toBeTruthy();
      const stored = JSON.parse(localStorageMock[STORAGE_KEY] as string);
      expect(stored.length).toBe(1);
      done();
    });
  });

  // updateExpense() should merge changes into an existing transaction
  it('should update an existing transaction', (done) => {
    const existing: Transaction = {
      id: '1',
      title: 'Old',
      category: 'Food',
      quantity: 1,
      unit: 'pcs',
      price: 50,
      total: 50,
      date: '2024-01-01',
      type: 'expense'
    };
    seedTransactions([existing]);

    service.updateExpense('1', { title: 'Updated', price: 100, total: 100 }).subscribe(tx => {
      expect(tx.title).toBe('Updated');
      const stored = JSON.parse(localStorageMock[STORAGE_KEY] as string) as Transaction[];
      expect(stored[0].price).toBe(100);
      done();
    });
  });

  // deleteExpense() should remove the transaction from storage
  it('should delete a transaction', (done) => {
    const existing: Transaction = {
      id: '1',
      title: 'To delete',
      category: 'Food',
      quantity: 1,
      unit: 'pcs',
      price: 50,
      total: 50,
      date: '2024-01-01',
      type: 'expense'
    };
    seedTransactions([existing]);

    service.deleteExpense('1').subscribe(() => {
      const stored = JSON.parse(localStorageMock[STORAGE_KEY] as string) as Transaction[];
      expect(stored.length).toBe(0);
      done();
    });
  });

  // getExpenseById() should return the matching transaction when it exists
  it('should get transaction by id', (done) => {
    const existing: Transaction = {
      id: '1',
      title: 'Find me',
      category: 'Food',
      quantity: 1,
      unit: 'pcs',
      price: 50,
      total: 50,
      date: '2024-01-01',
      type: 'expense'
    };
    seedTransactions([existing]);

    service.getExpenseById('1').subscribe(tx => {
      expect(tx).toBeTruthy();
      expect(tx?.id).toBe('1');
      done();
    });
  });

  // getOnlyExpenses()/getOnlyEarnings() should partition by type
  it('should separate expenses and earnings', (done) => {
    const list: Transaction[] = [
      { id: '1', title: 'Food', category: 'Food', quantity: 1, unit: 'pcs', price: 100, total: 100, date: '2024-01-01', type: 'expense' },
      { id: '2', title: 'Salary', category: 'Salary', quantity: 1, unit: 'month', price: 1000, total: 1000, date: '2024-01-02', type: 'earning' }
    ];
    seedTransactions(list);

    service.getOnlyExpenses().subscribe(expenses => {
      expect(expenses.length).toBe(1);
      expect(expenses[0].type).toBe('expense');
      service.getOnlyEarnings().subscribe(earnings => {
        expect(earnings.length).toBe(1);
        expect(earnings[0].type).toBe('earning');
        done();
      });
    });
  });

  // Aggregation helpers should return correct totals and net (earning - expense)
  it('should calculate total expense and earning and net amount', (done) => {
    const list: Transaction[] = [
      { id: '1', title: 'Food', category: 'Food', quantity: 1, unit: 'pcs', price: 100, total: 100, date: '2024-01-01', type: 'expense' },
      { id: '2', title: 'Transport', category: 'Transport', quantity: 1, unit: 'trip', price: 50, total: 50, date: '2024-01-02', type: 'expense' },
      { id: '3', title: 'Salary', category: 'Salary', quantity: 1, unit: 'month', price: 1000, total: 1000, date: '2024-01-03', type: 'earning' }
    ];
    seedTransactions(list);

    service.getTotalExpense().subscribe(totalExpense => {
      expect(totalExpense).toBe(150);
      service.getTotalEarning().subscribe(totalEarning => {
        expect(totalEarning).toBe(1000);
        service.getNetAmount().subscribe(net => {
          expect(net).toBe(850);
          done();
        });
      });
    });
  });

  // Grouping helpers should aggregate totals and counts per category
  it('should group expenses and earnings by category', (done) => {
    const list: Transaction[] = [
      { id: '1', title: 'Food1', category: 'Food', quantity: 1, unit: 'pcs', price: 100, total: 100, date: '2024-01-01', type: 'expense' },
      { id: '2', title: 'Food2', category: 'Food', quantity: 1, unit: 'pcs', price: 200, total: 200, date: '2024-01-02', type: 'expense' },
      { id: '3', title: 'Salary', category: 'Salary', quantity: 1, unit: 'month', price: 1000, total: 1000, date: '2024-01-03', type: 'earning' }
    ];
    seedTransactions(list);

    service.getExpensesByCategory().subscribe(expByCat => {
      const food = expByCat.find(e => e.category === 'Food');
      expect(food).toBeTruthy();
      expect(food?.total).toBe(300);
      expect(food?.count).toBe(2);

      service.getEarningsByCategory().subscribe(earnByCat => {
        const salary = earnByCat.find(e => e.category === 'Salary');
        expect(salary).toBeTruthy();
        expect(salary?.total).toBe(1000);
        expect(salary?.count).toBe(1);
        done();
      });
    });
  });
});
