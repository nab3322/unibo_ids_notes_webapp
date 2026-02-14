import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-container" [ngClass]="{'overlay': overlay}">
      <mat-spinner [diameter]="size" [color]="color"></mat-spinner>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 20px;
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }
    
    .spinner-message {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .overlay .spinner-message {
      color: white;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: number = 40;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() message: string = '';
  @Input() overlay: boolean = false;
}