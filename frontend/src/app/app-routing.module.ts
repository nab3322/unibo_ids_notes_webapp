import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  // 1. LOGIN / REGISTRAZIONE (Pubbliche)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
    canActivate: [GuestGuard]
  },

  // 2. DASHBOARD (Protetta)
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },

  // 3. NOTE (Protetta - Qui c'è il VERO editor per salvare)
  {
    path: 'notes',
    loadChildren: () => import('./features/notes/notes.module').then(m => m.NotesModule),
    canActivate: [AuthGuard]
  },

  // 4. CARTELLE (Protetta)
  {
    path: 'folders',
    loadChildren: () => import('./features/folders/folders.module').then(m => m.FoldersModule),
    canActivate: [AuthGuard]
  },

  // 5. NOTE CONDIVISE (Protetta)
  {
    path: 'shared',
    loadChildren: () => import('./features/shared/shared-notes.module').then(m => m.SharedNotesModule),
    canActivate: [AuthGuard]
  },

  // 6. RICERCA (Protetta)
  {
    path: 'search',
    loadChildren: () => import('./features/search/search.module').then(m => m.SearchModule),
    canActivate: [AuthGuard]
  },

  // 7. IMPOSTAZIONI (Protetta)
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
    canActivate: [AuthGuard]
  },

  // Redirect di base
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
