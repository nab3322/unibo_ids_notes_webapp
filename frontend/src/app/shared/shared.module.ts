import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';

// Components (Tutti decommentati perché esistono!)
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent } from './components/input-dialog/input-dialog.component';
import { TagInputComponent } from './components/tag-input/tag-input.component';
import { FolderTreeComponent } from './components/folder-tree/folder-tree.component';
import { ConflictResolverComponent } from './components/conflict-resolver/conflict-resolver.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ShareDialogComponent } from './components/share-dialog/share-dialog.component';

// Directives (Tutte decommentate)
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';

// Pipes (Tutte decommentate)
import { TruncatePipe } from './pipes/truncate.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { HighlightPipe } from './pipes/highlight.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatCardModule,
  MatToolbarModule,
  MatMenuModule,
  MatDialogModule,
  MatSnackBarModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatChipsModule,
  MatAutocompleteModule,
  MatSelectModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTabsModule,
  MatSidenavModule,
  MatListModule,
  MatGridListModule,
  MatButtonToggleModule,
  MatSlideToggleModule,
  MatTooltipModule,
  MatBadgeModule,
  MatExpansionModule,
  MatStepperModule,
  MatDividerModule
];

const COMPONENTS: any[] = [
  LoadingSpinnerComponent,
  ConfirmDialogComponent,
  InputDialogComponent,
  TagInputComponent,
  FolderTreeComponent,
  ConflictResolverComponent,
  EmptyStateComponent,
  ShareDialogComponent
];

const DIRECTIVES: any[] = [
  AutoFocusDirective,
  ClickOutsideDirective,
  InfiniteScrollDirective
];

const PIPES: any[] = [
  TruncatePipe,
  TimeAgoPipe,
  HighlightPipe,
  SafeHtmlPipe
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES
  ],
  declarations: [
    ...COMPONENTS,
    ...DIRECTIVES,
    ...PIPES
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    ...COMPONENTS,
    ...DIRECTIVES,
    ...PIPES
  ]
})
export class SharedModule { }
