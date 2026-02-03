import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface EmptyStateAction {
  label: string;
  action: string;
  color?: 'primary' | 'accent' | 'warn';
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state" [ngClass]="size">
      <div class="empty-state-content">
        <!-- Icon -->
        <div class="empty-icon" [ngClass]="'icon-' + type">
          <mat-icon>{{ icon || getDefaultIcon() }}</mat-icon>
        </div>
        
        <!-- Title -->
        <h3 class="empty-title" *ngIf="title">{{ title }}</h3>
        
        <!-- Description -->
        <p class="empty-description" *ngIf="description">{{ description }}</p>
        
        <!-- Custom content -->
        <div class="empty-custom-content" *ngIf="showCustomContent">
          <ng-content></ng-content>
        </div>
        
        <!-- Actions -->
        <div class="empty-actions" *ngIf="actions.length > 0">
          <button 
            *ngFor="let action of actions; trackBy: trackByAction"
            [color]="action.color || 'primary'"
            [disabled]="action.disabled"
            (click)="onActionClick(action)"
            mat-raised-button
            class="empty-action-button">
            <mat-icon *ngIf="action.icon">{{ action.icon }}</mat-icon>
            {{ action.label }}
          </button>
        </div>
        
        <!-- Loading state -->
        <div class="empty-loading" *ngIf="loading">
          <mat-spinner diameter="32"></mat-spinner>
          <p>{{ loadingMessage || 'Caricamento...' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      padding: 40px 20px;
      text-align: center;
    }
    
    .empty-state.small {
      min-height: 150px;
      padding: 20px;
    }
    
    .empty-state.large {
      min-height: 300px;
      padding: 60px 20px;
    }
    
    .empty-state-content {
      max-width: 400px;
      width: 100%;
    }
    
    .empty-icon {
      margin-bottom: 20px;
    }
    
    .empty-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.5;
    }
    
    .small .empty-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    
    .large .empty-icon mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
    }
    
    .icon-default mat-icon {
      color: rgba(0, 0, 0, 0.26);
    }
    
    .icon-search mat-icon {
      color: #9E9E9E;
    }
    
    .icon-error mat-icon {
      color: #F44336;
    }
    
    .icon-warning mat-icon {
      color: #FF9800;
    }
    
    .icon-info mat-icon {
      color: #2196F3;
    }
    
    .icon-success mat-icon {
      color: #4CAF50;
    }
    
    .empty-title {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
    
    .small .empty-title {
      font-size: 18px;
    }
    
    .large .empty-title {
      font-size: 24px;
    }
    
    .empty-description {
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .empty-custom-content {
      margin-bottom: 24px;
    }
    
    .empty-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    
    .empty-action-button {
      min-width: 120px;
    }
    
    .empty-action-button mat-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .empty-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }
    
    .empty-loading p {
      margin: 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    /* Responsive design */
    @media (min-width: 600px) {
      .empty-actions {
        flex-direction: row;
        justify-content: center;
      }
    }
    
    /* Animation */
    .empty-state-content {
      animation: fadeInUp 0.4s ease-out;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() icon: string = '';
  @Input() type: 'default' | 'search' | 'error' | 'warning' | 'info' | 'success' = 'default';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() actions: EmptyStateAction[] = [];
  @Input() loading: boolean = false;
  @Input() loadingMessage: string = '';
  @Input() showCustomContent: boolean = false;

  @Output() actionClicked = new EventEmitter<EmptyStateAction>();

  getDefaultIcon(): string {
    switch (this.type) {
      case 'search':
        return 'search_off';
      case 'error':
        return 'error_outline';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'inbox';
    }
  }

  onActionClick(action: EmptyStateAction): void {
    if (!action.disabled) {
      this.actionClicked.emit(action);
    }
  }

  trackByAction(index: number, action: EmptyStateAction): string {
    return action.action + index;
  }
}