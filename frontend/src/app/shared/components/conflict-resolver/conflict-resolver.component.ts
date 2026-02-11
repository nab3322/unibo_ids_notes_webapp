import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ConflictItem {
  id: string;
  field: string;
  localValue: any;
  remoteValue: any;
  resolved?: boolean;
  selectedValue?: 'local' | 'remote' | 'custom';
  customValue?: any;
  description?: string;
}

export interface ConflictResolution {
  action: 'resolve' | 'cancel';
  resolutions?: { [id: string]: { value: any; source: 'local' | 'remote' | 'custom' } };
}

@Component({
  selector: 'app-conflict-resolver',
  template: `
    <div class="conflict-resolver">
      <div class="resolver-header">
        <h3>
          <mat-icon>warning</mat-icon>
          Risoluzione Conflitti
        </h3>
        <p>Sono stati rilevati {{ conflicts.length }} conflitti che richiedono la tua attenzione.</p>
      </div>

      <div class="conflicts-list">
        <mat-expansion-panel *ngFor="let conflict of conflicts; trackBy: trackByConflictId">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon [color]="conflict.resolved ? 'primary' : 'warn'">
                {{ conflict.resolved ? 'check_circle' : 'error' }}
              </mat-icon>
              {{ conflict.field }}
            </mat-panel-title>
            <mat-panel-description>
              {{ conflict.description || 'Valori diversi rilevati' }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="conflict-content">
            <!-- Local Version -->
            <div class="version-option">
              <mat-radio-group 
                [value]="conflict.selectedValue" 
                (change)="onSelectionChange(conflict, $event.value)">
                
                <div class="version-card local-version">
                  <div class="version-header">
                    <mat-radio-button value="local">
                      Versione Locale
                    </mat-radio-button>
                    <mat-chip class="version-chip">LOCALE</mat-chip>
                  </div>
                  <div class="version-content">
                    <pre>{{ formatValue(conflict.localValue) }}</pre>
                  </div>
                </div>

                <!-- Remote Version -->
                <div class="version-card remote-version">
                  <div class="version-header">
                    <mat-radio-button value="remote">
                      Versione Remota
                    </mat-radio-button>
                    <mat-chip class="version-chip" color="accent">REMOTO</mat-chip>
                  </div>
                  <div class="version-content">
                    <pre>{{ formatValue(conflict.remoteValue) }}</pre>
                  </div>
                </div>

                <!-- Custom Value -->
                <div class="version-card custom-version">
                  <div class="version-header">
                    <mat-radio-button value="custom">
                      Valore Personalizzato
                    </mat-radio-button>
                    <mat-chip class="version-chip" color="warn">CUSTOM</mat-chip>
                  </div>
                  <div class="version-content">
                    <mat-form-field appearance="outline" class="custom-input">
                      <mat-label>Inserisci valore personalizzato</mat-label>
                      <textarea 
                        matInput
                        [value]="conflict.customValue || ''"
                        (input)="onCustomValueChange(conflict, $event)"
                        [disabled]="conflict.selectedValue !== 'custom'"
                        rows="3">
                      </textarea>
                    </mat-form-field>
                  </div>
                </div>
              </mat-radio-group>
            </div>
          </div>
        </mat-expansion-panel>
      </div>

      <div class="resolver-actions">
        <div class="resolution-summary">
          <span class="resolved-count">
            {{ getResolvedCount() }} di {{ conflicts.length }} conflitti risolti
          </span>
          <mat-progress-bar 
            mode="determinate" 
            [value]="getResolutionProgress()">
          </mat-progress-bar>
        </div>
        
        <div class="action-buttons">
          <button 
            mat-button 
            (click)="onCancel()"
            color="basic">
            Annulla
          </button>
          
          <button 
            mat-raised-button 
            [disabled]="!allConflictsResolved()"
            (click)="onResolve()"
            color="primary">
            Risolvi Tutti i Conflitti
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .conflict-resolver {
      max-width: 800px;
      margin: 0 auto;
    }

    .resolver-header {
      padding: 20px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .resolver-header h3 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0 0 12px 0;
      color: #f57c00;
    }

    .resolver-header p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .conflicts-list {
      margin: 20px;
    }

    .conflict-content {
      padding: 16px 0;
    }

    .version-option {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .version-card {
      border: 2px solid transparent;
      border-radius: 8px;
      padding: 16px;
      background-color: #fafafa;
      transition: all 0.3s ease;
    }

    .version-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .local-version {
      border-color: #4CAF50;
    }

    .remote-version {
      border-color: #2196F3;
    }

    .custom-version {
      border-color: #FF9800;
    }

    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .version-chip {
      font-size: 10px;
      font-weight: bold;
    }

    .version-content {
      margin-left: 32px;
    }

    .version-content pre {
      background-color: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      font-family: 'Courier New', monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      max-height: 150px;
      overflow-y: auto;
    }

    .custom-input {
      width: 100%;
    }

    .resolver-actions {
      padding: 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      background-color: #fafafa;
    }

    .resolution-summary {
      margin-bottom: 16px;
    }

    .resolved-count {
      display: block;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    mat-expansion-panel {
      margin-bottom: 8px;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ConflictResolverComponent {
  @Input() conflicts: ConflictItem[] = [];
  @Output() resolution = new EventEmitter<ConflictResolution>();

  trackByConflictId(index: number, conflict: ConflictItem): string {
    return conflict.id;
  }

  onSelectionChange(conflict: ConflictItem, value: 'local' | 'remote' | 'custom'): void {
    conflict.selectedValue = value;
    
    if (value === 'local') {
      conflict.customValue = conflict.localValue;
    } else if (value === 'remote') {
      conflict.customValue = conflict.remoteValue;
    }
    
    conflict.resolved = this.isConflictResolved(conflict);
  }

  onCustomValueChange(conflict: ConflictItem, event: any): void {
    conflict.customValue = event.target.value;
    conflict.resolved = this.isConflictResolved(conflict);
  }

  isConflictResolved(conflict: ConflictItem): boolean {
    return !!(conflict.selectedValue && 
             (conflict.selectedValue !== 'custom' || 
              (conflict.customValue !== null && conflict.customValue !== undefined && conflict.customValue !== '')));
  }

  getResolvedCount(): number {
    return this.conflicts.filter(c => c.resolved).length;
  }

  getResolutionProgress(): number {
    if (this.conflicts.length === 0) return 100;
    return (this.getResolvedCount() / this.conflicts.length) * 100;
  }

  allConflictsResolved(): boolean {
    return this.conflicts.length > 0 && this.conflicts.every(c => c.resolved);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '(vuoto)';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }

  onResolve(): void {
    const resolutions: { [id: string]: { value: any; source: 'local' | 'remote' | 'custom' } } = {};
    
    for (const conflict of this.conflicts) {
      if (conflict.resolved && conflict.selectedValue) {
        let finalValue: any;
        
        if (conflict.selectedValue === 'custom') {
          finalValue = conflict.customValue;
        } else if (conflict.selectedValue === 'local') {
          finalValue = conflict.localValue;
        } else {
          finalValue = conflict.remoteValue;
        }
        
        resolutions[conflict.id] = {
          value: finalValue,
          source: conflict.selectedValue
        };
      }
    }
    
    this.resolution.emit({
      action: 'resolve',
      resolutions
    });
  }

  onCancel(): void {
    this.resolution.emit({
      action: 'cancel'
    });
  }
}