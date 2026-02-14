import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { SharedNotesListComponent } from './shared-notes-list.component';
import { SharedNoteDetailComponent } from './shared-note-detail.component';

const routes: Routes = [
  { path: '', component: SharedNotesListComponent },
  { path: ':id', component: SharedNoteDetailComponent }
];

@NgModule({
  declarations: [
    SharedNotesListComponent,
    SharedNoteDetailComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    RouterModule.forChild(routes)
  ]
})
export class SharedNotesModule { }
