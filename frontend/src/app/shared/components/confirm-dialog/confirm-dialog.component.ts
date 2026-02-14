import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title class="dialog-title" [ngClass]="'dialog-' + data.type">
        <mat-icon *ngIf="getIcon()" class="dialog-icon">{{ getIcon() }}</mat-icon>
        {{ data.title }}
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()" [color]="'basic'">
          {{ data.cancelText || 'Annulla' }}
        </button>
        <button 
          mat-raised-button 
          (click)="onConfirm()" 
          [color]="getButtonColor()"
          cdkFocusInitial>
          {{ data.confirmText || 'Conferma' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
      max-width: 500px;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
    }
    
    .dialog-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .dialog-info .dialog-icon {
      color: #2196F3;
    }
    
    .dialog-warning .dialog-icon {
      color: #FF9800;
    }
    
    .dialog-danger .dialog-icon {
      color: #F44336;
    }
    
    .dialog-content {
      margin-bottom: 16px;
    }
    
    .dialog-content p {
      margin: 0;
      line-height: 1.5;
    }
    
    .dialog-actions {
      gap: 8px;
      margin: 0;
      padding: 0;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default type if not provided
    if (!this.data.type) {
      this.data.type = 'info';
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return '';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'warning':
        return 'accent';
      default:
        return 'primary';
    }
  }
}