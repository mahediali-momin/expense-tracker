import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ExpenseService, Expense } from '../../services/expense';
import { CategoryService } from '../../services/category';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, provideNativeDateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

// Custom date format
const MY_DATE_FORMATS = {
    parse: {
        dateInput: 'MM/DD/YYYY',
    },
    display: {
        dateInput: 'MM/DD/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

interface CategoryData {
    category: string;
    total: number;
    count: number;
    percentage: number;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.css'],
    standalone: true,
    providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
    ],
    imports: [
        CommonModule,
        RouterModule,
        MatFormFieldModule,
        MatDatepickerModule,
        FormsModule,
        MatDatepickerModule,
        MatInputModule,
        MatFormFieldModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        HighchartsChartComponent
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
export class DashboardComponent implements OnInit {
    expenses: Expense[] = [];
    totalExpense: number = 0;
    totalEarning: number = 0;
    netAmount: number = 0;
    expenseCategoryData: CategoryData[] = [];
    earningCategoryData: CategoryData[] = [];
    topExpenseCategory: CategoryData | null = null;
    topEarningCategory: CategoryData | null = null;
    totalTransactions: number = 0;
    totalExpenseTransactions: number = 0;
    totalEarningTransactions: number = 0;
    averageExpense: number = 0;
    averageEarning: number = 0;

    // filtering
    startDate: Date | null = null;
    endDate: Date | null = null;

    // raw transactions (unfiltered)
    rawTransactions: Expense[] = [];

    // category meta map
    private categoryColorMap: { [name: string]: string } = {};

    private chartColors: string[] = ['#2563eb', '#667eea', '#764ba2', '#f59e0b', '#16a34a', '#dc2626', '#8b5cf6', '#06b6d4'];

    // Highcharts donut options (library itself is provided via provideHighcharts in AppModule)
    donutChartOptions: Highcharts.Options = {};

    constructor(private service: ExpenseService, private categoryService: CategoryService) { }

    ngOnInit(): void {
        this.loadDashboard();
        // build category color map
        try {
            const expenseMeta = this.categoryService.getExpenseCategoriesMetaSync();
            const earningMeta = this.categoryService.getEarningCategoriesMetaSync();
            const all = expenseMeta.concat(earningMeta);
            all.forEach(m => { this.categoryColorMap[m.name] = m.color || '#94A3B8'; });
        } catch { }
    }

    loadDashboard(): void {
        // Load all transactions then compute stats (we will filter client-side)
        this.service.getExpenses().subscribe(transactions => {
            this.rawTransactions = transactions;
            // apply any filters (none initially)
            this.applyFilters();
        });
    }

    applyFilters(): void {
        let list = this.rawTransactions.slice();
        if (this.startDate) {
            const s = new Date(this.startDate).setHours(0, 0, 0, 0);
            list = list.filter(t => new Date(t.date).getTime() >= s);
        }
        if (this.endDate) {
            const e = new Date(this.endDate).setHours(23, 59, 59, 999);
            list = list.filter(t => new Date(t.date).getTime() <= e);
        }
        // compute metrics from list
        this.computeFrom(list);
    }

    resetFilters(): void {
        this.startDate = null;
        this.endDate = null;
        this.applyFilters();
    }

    private computeFrom(transactions: Expense[]): void {
        this.expenses = transactions;
        this.totalTransactions = transactions.length;
        const expenseList = transactions.filter(t => t.type !== 'earning');
        const earningList = transactions.filter(t => t.type === 'earning');
        this.totalExpense = expenseList.reduce((s, t) => s + (t.total || 0), 0);
        this.totalEarning = earningList.reduce((s, t) => s + (t.total || 0), 0);
        this.totalExpenseTransactions = expenseList.length;
        this.totalEarningTransactions = earningList.length;
        this.averageExpense = this.totalExpenseTransactions > 0 ? this.totalExpense / this.totalExpenseTransactions : 0;
        this.averageEarning = this.totalEarningTransactions > 0 ? this.totalEarning / this.totalEarningTransactions : 0;
        this.calculateNet();

        // category grouping
        const expMap: { [k: string]: { total: number, count: number } } = {};
        expenseList.forEach(e => {
            if (!expMap[e.category]) expMap[e.category] = { total: 0, count: 0 };
            expMap[e.category].total += e.total;
            expMap[e.category].count += 1;
        });
        const expData = Object.entries(expMap).map(([category, d]) => ({ category, total: d.total, count: d.count }));
        this.expenseCategoryData = this.calculatePercentages(expData);
        this.topExpenseCategory = this.expenseCategoryData.length > 0 ? this.expenseCategoryData[0] : null;

        const earnMap: { [k: string]: { total: number, count: number } } = {};
        earningList.forEach(e => {
            if (!earnMap[e.category]) earnMap[e.category] = { total: 0, count: 0 };
            earnMap[e.category].total += e.total;
            earnMap[e.category].count += 1;
        });
        const earnData = Object.entries(earnMap).map(([category, d]) => ({ category, total: d.total, count: d.count }));
        this.earningCategoryData = this.calculatePercentages(earnData);
        this.topEarningCategory = this.earningCategoryData.length > 0 ? this.earningCategoryData[0] : null;

        // Update Highcharts donut series whenever totals change
        this.updateDonutChart();
    }

    /**
     * Calculate net amount (earnings - expenses)
     */
    private calculateNet(): void {
        this.netAmount = this.totalEarning - this.totalExpense;
    }

    /**
     * Configure Highcharts donut data for Expense vs Earning
     */
    private updateDonutChart(): void {
        // Inner ring: Expense vs Earning totals
        const innerData: Highcharts.PointOptionsObject[] = [];
        if (this.totalExpense > 0) {
            innerData.push({ name: 'Expense', y: this.totalExpense, color: '#ef4444' });
        }
        if (this.totalEarning > 0) {
            innerData.push({ name: 'Earning', y: this.totalEarning, color: '#16a34a' });
        }

        // Outer ring: detailed categories (only expenses, category-wise)
        const outerData: Highcharts.PointOptionsObject[] = [];
        this.expenseCategoryData.forEach((cat, index) => {
            if (cat.total > 0) {
                outerData.push({
                    name: cat.category,
                    y: cat.total,
                    color: this.getCategoryColor(index, cat.category)
                });
            }
        });

        const hasData = innerData.length > 0 && outerData.length > 0;

        if (!hasData) {
            this.donutChartOptions = {
                chart: { type: 'pie', backgroundColor: 'transparent' },
                title: { text: undefined },
                series: [
                    {
                        type: 'pie',
                        innerSize: '60%',
                        data: [{ name: 'No data', y: 1, color: '#e5e7eb' }]
                    }
                ]
            };
            return;
        }

        const innerSeries: Highcharts.SeriesPieOptions = {
            type: 'pie',
            name: 'Totals',
            // Slightly smaller and shifted left to give labels space on the right
            size: '50%',
            innerSize: '30%',
            center: ['35%', '50%'],
            data: innerData,
            dataLabels: {
                enabled: true,
                distance: -20,
                style: { fontWeight: 'bold', textOutline: 'none', color: '#111827' },
                format: '{point.name}'
            }
        };

        const outerSeries: Highcharts.SeriesPieOptions = {
            type: 'pie',
            name: 'Categories',
            // Outer ring a bit smaller and sharing same center
            size: '70%',
            innerSize: '50%',
            center: ['35%', '50%'],
            data: outerData,
            dataLabels: {
                enabled: true,
                distance: 20,
                softConnector: true,
                crop: false,
                overflow: 'allow',
                style: { fontSize: '11px', textOutline: 'none' },
                formatter: function (): string {
                    const name = (this as any).point?.name || '';
                    const pctVal = (this as any).percentage;
                    const pct = typeof pctVal === 'number' ? pctVal.toFixed(1) : '';
                    return pct ? `${name}: ${pct}%` : name;
                }
            }
        };

        this.donutChartOptions = {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                marginRight: 80
            },
            title: { text: undefined },
            tooltip: {
                pointFormat: '{series.name} - <b>{point.name}</b>: {point.y:.2f} ({point.percentage:.1f}%)'
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    showInLegend: false,
                    borderWidth: 0
                }
            },
            series: [innerSeries, outerSeries]
        };
    }

    /**
     * Calculate percentage for each category
     */
    private calculatePercentages(data: any[]): CategoryData[] {
        const total = data.reduce((sum, item) => sum + item.total, 0);
        return data.map(item => ({
            ...item,
            percentage: total > 0 ? Math.round((item.total / total) * 100) : 0
        })).sort((a, b) => b.total - a.total);
    }

    /**
     * Get color for category
     */
    getCategoryColor(index: number, categoryName?: string): string {
        if (categoryName && this.categoryColorMap[categoryName]) return this.categoryColorMap[categoryName];
        return this.chartColors[index % this.chartColors.length];
    }

    /**
     * Format date
     */
    formatDate(dateStr: string): string {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    }

    /** Donut chart helpers */
    getDonutPercentages(): { expensePct: number; earningPct: number } {
        const tot = this.totalExpense + this.totalEarning;
        if (tot <= 0) return { expensePct: 0, earningPct: 0 };
        const expensePct = Math.round((this.totalExpense / tot) * 100);
        const earningPct = 100 - expensePct;
        return { expensePct, earningPct };
    }

    /**
     * Format currency
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    /**
     * Refresh dashboard and reset filters
     */
    refresh(): void {
        this.startDate = null;
        this.endDate = null;
        this.loadDashboard();
    }

    /**
     * Handle start date change
     */
    onStartDateChange(event: any): void {
        if (event.value) {
            this.startDate = event.value;
            this.applyFilters();
        }
    }

    /**
     * Handle end date change
     */
    onEndDateChange(event: any): void {
        if (event.value) {
            this.endDate = event.value;
            this.applyFilters();
        }
    }

    /**
     * Handle date range change
     */
    onRangeChange(event: any): void {
        if (this.startDate && this.endDate) {
            this.applyFilters();
        }
    }
}
