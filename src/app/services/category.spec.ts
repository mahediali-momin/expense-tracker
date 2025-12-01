// Spec summary: unit tests for CategoryService default seeding, legacy format
// normalization, add/delete for expense & earning categories, and reset behavior.
import { TestBed } from '@angular/core/testing';
import { CategoryService, CategoryMeta } from './category';

describe('CategoryService', () => {
    let service: CategoryService;
    // Local fake storage backing the spies so we can assert persisted values
    let localStorageMock: { [key: string]: string | null };

    const EXP_KEY = 'expense_categories';
    const EARN_KEY = 'earning_categories';

    beforeEach(() => {
        localStorageMock = {};

        // Redirect localStorage calls into our in-memory map
        spyOn(window.localStorage, 'getItem').and.callFake((key: string) => {
            return localStorageMock[key] ?? null;
        });

        spyOn(window.localStorage, 'setItem').and.callFake((key: string, value: string) => {
            localStorageMock[key] = value;
        });

        TestBed.configureTestingModule({});
        service = TestBed.inject(CategoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // On first use, service should seed default expense and earning categories
    it('should initialize default categories when none exist', () => {
        const expenseNames = service.getExpenseCategoriesSync();
        const earningNames = service.getEarningCategoriesSync();

        expect(expenseNames.length).toBeGreaterThan(0);
        expect(earningNames.length).toBeGreaterThan(0);
        expect(localStorageMock[EXP_KEY]).toBeTruthy();
        expect(localStorageMock[EARN_KEY]).toBeTruthy();
    });

    // Legacy string[] format in storage should be converted to CategoryMeta[]
    it('should normalize old string[] format to meta[] for expenses', () => {
        localStorageMock[EXP_KEY] = JSON.stringify(['OldCat1', 'OldCat2']);

        const metas = service.getExpenseCategoriesMetaSync();

        expect(metas.length).toBe(2);
        expect(metas[0].name).toBe('OldCat1');
        expect((metas[0] as CategoryMeta).color).toBeTruthy();
        const stored = JSON.parse(localStorageMock[EXP_KEY] as string);
        expect(Array.isArray(stored)).toBeTrue();
        expect(typeof stored[0]).toBe('object');
    });

    // Adding a new, unique expense category should succeed and be discoverable via sync API
    it('should add a new unique expense category', (done) => {
        service.addExpenseCategory('NewExpense', '#123456').subscribe((success: boolean) => {
            expect(success).toBeTrue();
            const names = service.getExpenseCategoriesSync();
            expect(names).toContain('NewExpense');
            done();
        });
    });

    // Duplicates (ignoring case) should be rejected with a false result
    it('should not add duplicate expense category (case-insensitive)', (done) => {
        localStorageMock[EXP_KEY] = JSON.stringify([{ name: 'Food', color: '#fff' }]);

        service.addExpenseCategory('food').subscribe((success: boolean) => {
            expect(success).toBeFalse();
            done();
        });
    });

    // Deleting an existing expense category should remove it from the stored list
    it('should delete an existing expense category', (done) => {
        localStorageMock[EXP_KEY] = JSON.stringify([
            { name: 'Food', color: '#fff' },
            { name: 'Transport', color: '#000' }
        ]);

        service.deleteExpenseCategory('Food').subscribe((success: boolean) => {
            expect(success).toBeTrue();
            const names = service.getExpenseCategoriesSync();
            expect(names).not.toContain('Food');
            done();
        });
    });

    // Mirror behavior for earning categories: add then delete successfully
    it('should add and delete earning categories similarly', (done) => {
        // Use a name that is not part of the default earning categories to avoid duplicates
        service.addEarningCategory('NewBonus').subscribe((addSuccess: boolean) => {
            expect(addSuccess).toBeTrue();
            const earningNames = service.getEarningCategoriesSync();
            expect(earningNames).toContain('NewBonus');

            service.deleteEarningCategory('NewBonus').subscribe((delSuccess: boolean) => {
                expect(delSuccess).toBeTrue();
                const afterDelete = service.getEarningCategoriesSync();
                expect(afterDelete).not.toContain('NewBonus');
                done();
            });
        });
    });

    // resetToDefaults() should restore both sets of defaults
    it('should reset categories to defaults', (done) => {
        service.resetToDefaults().subscribe((success: boolean) => {
            expect(success).toBeTrue();
            const expenseNames = service.getExpenseCategoriesSync();
            const earningNames = service.getEarningCategoriesSync();
            expect(expenseNames.length).toBeGreaterThan(0);
            expect(earningNames.length).toBeGreaterThan(0);
            done();
        });
    });
});
