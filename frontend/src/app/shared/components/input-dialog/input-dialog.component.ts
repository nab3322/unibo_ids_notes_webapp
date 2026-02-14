import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

export interface InputDialogData {
  title: string;
  message?: string;
  inputLabel: string;
  inputValue?: string;
  inputPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  maxLength?: number;
}

@Component({
  selector: 'app-input-dialog',
  template: `
    <div class="input-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="dialog-icon">edit</mat-icon>
        {{ data.title }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <p *ngIf="data.message" class="dialog-message">{{ data.message }}</p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.inputLabel }}</mat-label>
          <input
            matInput
            [formControl]="inputControl"
            [placeholder]="data.inputPlaceholder || ''"
            [maxlength]="data.maxLength || 100"
            (keydown.enter)="onConfirm()"
            cdkFocusInitial>
          <mat-error *ngIf="inputControl.hasError('required')">
            Questo campo è obbligatorio
          </mat-error>
          <mat-hint *ngIf="data.maxLength" align="end">
            {{ inputControl.value?.length || 0 }}/{{ data.maxLength }}
          </mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Annulla' }}
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          [disabled]="inputControl.invalid">
          {{ data.confirmText || 'Conferma' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .input-dialog {
      min-width: 350px;
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
      color: #1976d2;
    }

    .dialog-content {
      margin-bottom: 16px;
    }

    .dialog-message {
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      gap: 8px;
      margin: 0;
      padding: 0;
    }
  `]
})
export class InputDialogComponent {
  inputControl: FormControl;

  constructor(
    public dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputDialogData
  ) {
    const validators = [];
    if (data.required !== false) {
      validators.push(Validators.required);
    }
    if (data.maxLength) {
      validators.push(Validators.maxLength(data.maxLength));
    }

    this.inputControl = new FormControl(data.inputValue || '', validators);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.inputControl.valid) {
      this.dialogRef.close(this.inputControl.value.trim());
    }
  }
}
