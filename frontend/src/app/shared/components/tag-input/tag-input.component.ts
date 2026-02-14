import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-tag-input',
  template: `
    <mat-form-field class="tag-input-field" [appearance]="appearance">
      <mat-label>{{ placeholder }}</mat-label>
      
      <mat-chip-grid #chipGrid aria-label="Tags">
        <mat-chip-row
          *ngFor="let tag of selectedTags"
          [removable]="removable"
          (removed)="removeTag(tag)">
          {{ tag }}
          <button matChipRemove *ngIf="removable" [attr.aria-label]="'Rimuovi ' + tag">
            <mat-icon>cancel</mat-icon>
          </button>
        </mat-chip-row>
        
        <input
          #tagInput
          [formControl]="tagCtrl"
          [matAutocomplete]="auto"
          [matChipInputFor]="chipGrid"
          [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
          (matChipInputTokenEnd)="addTag($event)"
          [placeholder]="selectedTags.length === 0 ? placeholder : ''"
          [readonly]="readonly">
      </mat-chip-grid>
      
      <mat-autocomplete 
        #auto="matAutocomplete" 
        (optionSelected)="selected($event)"
        [displayWith]="displayFn">
        <mat-option *ngFor="let suggestion of filteredSuggestions | async" [value]="suggestion">
          {{ suggestion }}
        </mat-option>
      </mat-autocomplete>
      
      <mat-error *ngIf="errorMessage">{{ errorMessage }}</mat-error>
    </mat-form-field>
  `,
  styles: [`
    .tag-input-field {
      width: 100%;
    }
    
    mat-chip-grid {
      min-height: 32px;
    }
    
    mat-chip-row {
      margin: 2px;
    }
    
    input {
      border: none;
      outline: none;
      background: transparent;
      margin: 0;
      padding: 0;
      min-width: 100px;
    }
    
    mat-error {
      font-size: 12px;
    }
  `]
})
export class TagInputComponent {
  @Input() selectedTags: string[] = [];
  @Input() suggestions: string[] = [];
  @Input() placeholder: string = 'Aggiungi tag...';
  @Input() removable: boolean = true;
  @Input() readonly: boolean = false;
  @Input() maxTags: number = 0; // 0 = unlimited
  @Input() appearance: 'fill' | 'outline' = 'outline';
  @Input() errorMessage: string = '';

  @Output() tagsChange = new EventEmitter<string[]>();
  @Output() tagAdded = new EventEmitter<string>();
  @Output() tagRemoved = new EventEmitter<string>();

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  tagCtrl = new FormControl('');
  filteredSuggestions: Observable<string[]>;
  separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {
    this.filteredSuggestions = this.tagCtrl.valueChanges.pipe(
      startWith(''),
      map((tag: string | null) => this.filterSuggestions(tag || ''))
    );
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.canAddTag(value)) {
      this.selectedTags.push(value);
      this.emitChanges();
      this.tagAdded.emit(value);
    }

    // Clear the input value
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);

    if (index >= 0) {
      this.selectedTags.splice(index, 1);
      this.emitChanges();
      this.tagRemoved.emit(tag);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    
    if (this.canAddTag(value)) {
      this.selectedTags.push(value);
      this.emitChanges();
      this.tagAdded.emit(value);
    }

    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private canAddTag(tag: string): boolean {
    if (!tag || this.selectedTags.includes(tag)) {
      return false;
    }
    
    if (this.maxTags > 0 && this.selectedTags.length >= this.maxTags) {
      return false;
    }
    
    return true;
  }

  private filterSuggestions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(filterValue) && 
        !this.selectedTags.includes(suggestion)
      );
  }

  private emitChanges(): void {
    this.tagsChange.emit([...this.selectedTags]);
  }

  displayFn(tag: string): string {
    return tag || '';
  }
}