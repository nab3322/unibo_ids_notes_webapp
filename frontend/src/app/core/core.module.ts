import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Services (AuthService usa providedIn: 'root', importato dove serve)
import { NoteService } from './services/note.service';
import { ConflictService } from './services/conflict.service';
import { SearchService } from './services/search.service';
import { WebSocketService } from './services/websocket.service';
import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notification.service';
import { FolderService } from './services/folder.service';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

// Interceptors
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    // Services (AuthService usa providedIn: 'root', non serve qui)
    NoteService,
    ConflictService,
    SearchService,
    WebSocketService,
    LoadingService,
    NotificationService,
    FolderService,

    // Guards
    AuthGuard,
    GuestGuard,

    // Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule è già stato caricato. Importalo solo in AppModule.');
    }
  }
}
