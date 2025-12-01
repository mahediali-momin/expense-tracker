import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CategoryMeta {
    name: string;
    color?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private readonly EXPENSE_CATEGORIES_KEY = 'expense_categories';
    private readonly EARNING_CATEGORIES_KEY = 'earning_categories';

    // defaults with gentle colors so categories have an initial color.
    private defaultExpenseCategories: CategoryMeta[] = [
        { name: 'Food & Groceries', color: '#EF4444' },
        { name: 'Transport', color: '#2563EB' },
        { name: 'Utilities', color: '#F59E0B' },
        { name: 'Entertainment', color: '#8B5CF6' },
        { name: 'Shopping', color: '#06B6D4' },
        { name: 'Healthcare', color: '#10B981' },
        { name: 'Education', color: '#7C3AED' },
        { name: 'Travel', color: '#FB923C' },
        { name: 'Dining Out', color: '#F97316' },
        { name: 'Personal Care', color: '#DB2777' },
        { name: 'Home & Rent', color: '#0EA5E9' },
        { name: 'Insurance', color: '#84CC16' },
        { name: 'Other', color: '#94A3B8' }
    ];

    private defaultEarningCategories: CategoryMeta[] = [
        { name: 'Salary', color: '#16A34A' },
        { name: 'Freelance', color: '#2563EB' },
        { name: 'Investment', color: '#F59E0B' },
        { name: 'Bonus', color: '#7C3AED' },
        { name: 'Gift', color: '#FB7185' },
        { name: 'Refund', color: '#06B6D4' },
        { name: 'Other Income', color: '#94A3B8' }
    ];

    constructor() {
        this.initializeDefaults();
    }

    /**
     * Initialize default categories if they don't exist.
     * If an older string[] format is present, normalize it to CategoryMeta[] and persist.
     */
    private initializeDefaults(): void {
        // expenses
        const expRaw = localStorage.getItem(this.EXPENSE_CATEGORIES_KEY);
        if (!expRaw) {
            localStorage.setItem(this.EXPENSE_CATEGORIES_KEY, JSON.stringify(this.defaultExpenseCategories));
        } else {
            // normalize old string[] to meta[]
            try {
                const parsed = JSON.parse(expRaw);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    const metas = (parsed as string[]).map((n, i) => ({ name: n, color: this.pickColorFor(n, i) }));
                    localStorage.setItem(this.EXPENSE_CATEGORIES_KEY, JSON.stringify(metas));
                }
            } catch { /* ignore */ }
        }

        // earnings
        const earnRaw = localStorage.getItem(this.EARNING_CATEGORIES_KEY);
        if (!earnRaw) {
            localStorage.setItem(this.EARNING_CATEGORIES_KEY, JSON.stringify(this.defaultEarningCategories));
        } else {
            try {
                const parsed = JSON.parse(earnRaw);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    const metas = (parsed as string[]).map((n, i) => ({ name: n, color: this.pickColorFor(n, i) }));
                    localStorage.setItem(this.EARNING_CATEGORIES_KEY, JSON.stringify(metas));
                }
            } catch { /* ignore */ }
        }
    }

    /**
     * Return names (backwards compatible)
     */
    getExpenseCategories(): Observable<string[]> {
        return of(this.getExpenseCategoriesSync());
    }

    getEarningCategories(): Observable<string[]> {
        return of(this.getEarningCategoriesSync());
    }

    /**
     * Return meta objects (name + color)
     */
    getExpenseCategoriesMeta(): Observable<CategoryMeta[]> {
        return of(this.getExpenseCategoriesMetaSync());
    }

    getEarningCategoriesMeta(): Observable<CategoryMeta[]> {
        return of(this.getEarningCategoriesMetaSync());
    }

    /**
     * Sync helpers
     */
    getExpenseCategoriesSync(): string[] {
        return this.getExpenseCategoriesMetaSync().map(m => m.name);
    }

    getEarningCategoriesSync(): string[] {
        return this.getEarningCategoriesMetaSync().map(m => m.name);
    }

    getExpenseCategoriesMetaSync(): CategoryMeta[] {
        try {
            const data = localStorage.getItem(this.EXPENSE_CATEGORIES_KEY);
            if (!data) return this.defaultExpenseCategories.slice();
            const parsed = JSON.parse(data);
            // old format: array of strings
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                const metas = (parsed as string[]).map((n, i) => ({ name: n, color: this.pickColorFor(n, i) }));
                // persist normalized form
                localStorage.setItem(this.EXPENSE_CATEGORIES_KEY, JSON.stringify(metas));
                return metas;
            }
            // assume meta array
            return parsed as CategoryMeta[];
        } catch (error) {
            console.error('Error reading expense categories meta', error);
            return this.defaultExpenseCategories.slice();
        }
    }

    getEarningCategoriesMetaSync(): CategoryMeta[] {
        try {
            const data = localStorage.getItem(this.EARNING_CATEGORIES_KEY);
            if (!data) return this.defaultEarningCategories.slice();
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                const metas = (parsed as string[]).map((n, i) => ({ name: n, color: this.pickColorFor(n, i) }));
                localStorage.setItem(this.EARNING_CATEGORIES_KEY, JSON.stringify(metas));
                return metas;
            }
            return parsed as CategoryMeta[];
        } catch (error) {
            console.error('Error reading earning categories meta', error);
            return this.defaultEarningCategories.slice();
        }
    }

    /**
     * Add new expense category with optional color
     */
    addExpenseCategory(name: string, color?: string): Observable<boolean> {
        try {
            if (!name || name.trim() === '') return of(false);
            const list = this.getExpenseCategoriesMetaSync();
            const trimmed = name.trim();
            if (list.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return of(false);
            list.push({ name: trimmed, color: color || this.pickColorFor(trimmed, list.length) });
            localStorage.setItem(this.EXPENSE_CATEGORIES_KEY, JSON.stringify(list));
            return of(true);
        } catch (error) {
            console.error('Error adding expense category', error);
            return of(false);
        }
    }

    addEarningCategory(name: string, color?: string): Observable<boolean> {
        try {
            if (!name || name.trim() === '') return of(false);
            const list = this.getEarningCategoriesMetaSync();
            const trimmed = name.trim();
            if (list.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return of(false);
            list.push({ name: trimmed, color: color || this.pickColorFor(trimmed, list.length) });
            localStorage.setItem(this.EARNING_CATEGORIES_KEY, JSON.stringify(list));
            return of(true);
        } catch (error) {
            console.error('Error adding earning category', error);
            return of(false);
        }
    }

    deleteExpenseCategory(name: string): Observable<boolean> {
        try {
            const list = this.getExpenseCategoriesMetaSync();
            const idx = list.findIndex(i => i.name === name);
            if (idx === -1) return of(false);
            list.splice(idx, 1);
            localStorage.setItem(this.EXPENSE_CATEGORIES_KEY, JSON.stringify(list));
            return of(true);
        } catch (error) {
            console.error('Error deleting expense category', error);
            return of(false);
        }
    }

    deleteEarningCategory(name: string): Observable<boolean> {
        try {
            const list = this.getEarningCategoriesMetaSync();
            const idx = list.findIndex(i => i.name === name);
            if (idx === -1) return of(false);
            list.splice(idx, 1);
            localStorage.setItem(this.EARNING_CATEGORIES_KEY, JSON.stringify(list));
            return of(true);
        } catch (error) {
            console.error('Error deleting earning category', error);
            return of(false);
        }
    }

    resetToDefaults(): Observable<boolean> {
        try {
            localStorage.setItem(this.EXPENSE_CATEGORIES_KEY, JSON.stringify(this.defaultExpenseCategories));
            localStorage.setItem(this.EARNING_CATEGORIES_KEY, JSON.stringify(this.defaultEarningCategories));
            return of(true);
        } catch (error) {
            console.error('Error resetting categories', error);
            return of(false);
        }
    }

    /** pick a color from palette for new categories */
    private pickColorFor(name: string, index: number): string {
        const palette = ['#2563EB', '#EF4444', '#F59E0B', '#16A34A', '#8B5CF6', '#06B6D4', '#FB7185', '#7C3AED', '#F97316', '#84CC16'];
        return palette[index % palette.length];
    }
}
