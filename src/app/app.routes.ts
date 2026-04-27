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
    path: 'admin',
    children: [
      {
        path: 'moderacion',
        loadComponent: () => import('./moderation-management/moderation-management.page').then( m => m.ModerationManagementPage)
      },
      {
        path: 'gestion-libros',
        loadComponent: () => import('./book-management/book-management.page').then(m => m.BookManagementPage)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./user-management/user-management.page').then(m => m.UserManagementPage)
      },
      {
        path: 'taxonomia',
        redirectTo: 'gestion-libros'
      },
      {
        path: 'takedowns',
        redirectTo: 'gestion-libros'
      },
      {
        path: 'analitica',
        redirectTo: 'gestion-libros'
      }
    ]
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
    path: 'book-detail/:id',
    loadComponent: () => import('./book-detail/book-detail.page').then( m => m.BookDetailPage)
  },
  {
    path: 'summary-detail/:id',
    loadComponent: () => import('./summary-detail/summary-detail.page').then( m => m.SummaryDetailPage)
  },
  {
    path: 'review-detail/:id',
    loadComponent: () => import('./review-detail/review-detail.page').then( m => m.ReviewDetailPage)
  },
  {
    path: 'me/reviews',
    loadComponent: () => import('./my-reviews/my-reviews.page').then( m => m.MyReviewsPage)
  },
  {
    path: 'me/summaries',
    loadComponent: () => import('./my-summaries/my-summaries.page').then( m => m.MySummariesPage)
  },
  {
    path: 'first-page',
    loadComponent: () => import('./first-page/first-page.page').then( m => m.FirstPagePage)
  },
  {
    path: 'explore',
    loadComponent: () => import('./explore/explore.page').then( m => m.ExplorePage)
  },
  {
    path: 'summary',
    loadComponent: () => import('./summary/summary.page').then( m => m.SummaryPage)
  },
  {
    path: 'review',
    loadComponent: () => import('./review/review.page').then( m => m.ReviewPage)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'my-lists',
    loadComponent: () => import('./my-lists/my-lists.page').then( m => m.MyListsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.page').then( m => m.NotificationsPage)
  },
];
