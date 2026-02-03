import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module'; // Usa percorso relativo per sicurezza

// Layout Components
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FooterComponent } from './footer/footer.component';
import { LayoutComponent } from './layout.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    LayoutComponent
  ],
  exports: [
    LayoutComponent // Esportiamo LayoutComponent perché lo useremo in AppComponent
  ]
})
export class LayoutModule { }
