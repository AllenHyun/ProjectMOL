import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'book-management',
    loadComponent: () => import('./book-management/book-management.page').then( m => m.BookManagementPage)
  },
  {
    path: 'book-detail/:id',
    loadComponent: () => import('./book-detail/book-detail.page').then( m => m.BookDetailPage)
  },
];
