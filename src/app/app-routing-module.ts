import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/list-expense/list-expense').then(m => m.ListExpense)
  },
  {
    path: 'add',
    loadComponent: () => import('./components/add-expense/add-expense').then(m => m.AddExpenseComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/add-expense/add-expense').then(m => m.AddExpenseComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
